#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <SPIFFS.h>

#include "wifi-credentials.h"
WebServer server(80);

void setup()
{
  Serial.begin(115200);
  // connect devboard to wifi
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  if (WiFi.waitForConnectResult() != WL_CONNECTED) {
    Serial.println("WiFi Connect Failed! Rebooting...");delay(1000);
    ESP.restart();
  }

  // dont forget instructions on where web server can be found
  Serial.print("\nGo to http://");
  Serial.print(WiFi.localIP());
  Serial.println("/ to access ESP32 webserver");

  // open SPIFFS
  Serial.println("Setting up SPIFFS");
  if (!SPIFFS.begin(true)) {
    Serial.println("Error occurred while mounting SPIFFS"); return;
  }

  Serial.println("");
  // get all files uploaded to SPIFFS root directory
  // and create url routes for each file
  File root = SPIFFS.open("/");
  File file = root.openNextFile();  // read first file in directory
  while (file) {
    // create url routes for each file found
    Serial.print("Creating route to "); Serial.println(file.name());
    server.serveStatic(file.name(), SPIFFS, file.name());
    file = root.openNextFile(); // read next file entry
  }
  server.serveStatic("/", SPIFFS, "/index.html");  // create default route
  
  server.begin(); // start web server

}

void loop()
{
  server.handleClient();
}
