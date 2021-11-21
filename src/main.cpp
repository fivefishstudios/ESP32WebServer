#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <SPIFFS.h>

#include <FastLED.h>
#define FASTLED_INTERNAL
#define LED_PIN     3
#define NUM_LEDS    288
#define BRIGHTNESS  64
#define LED_TYPE    WS2812B
#define COLOR_ORDER GRB
#define NUM_ROWS    18
#define NUM_COLS    16
CRGB leds[NUM_LEDS];
int led_pos=0;
bool DisplayStatus = LOW;

#include "wifi-credentials.h"
WebServer server(80);

// convert X,Y position to a linear array, with zigzag wiring
// position 1,1 is lower-left corner, first row
// first row wiring is left-to-right
// second row wiring is right-to-left
int LEDArrayPosition(int x, int y){
  // do some bounds checking 
  if (x>NUM_COLS) x=NUM_COLS;
  if (x<1) x=1;
  if (y>NUM_ROWS) y = NUM_ROWS;
  if (y<1) y=1;

  if (y%2==0){
    led_pos = ((y) * NUM_COLS) - x;  // even row
  } else {
    led_pos = x + ((y-1) * NUM_COLS) -1;  // odd row 
  }
  return led_pos;
}

// draw a single pixel on the matrix screen at specified color
void DrawPixel(uint8_t x, uint8_t y, CRGB pixelcolor){
  leds[LEDArrayPosition(x, y)] += pixelcolor;
}



// forward declarations ----------------------------
String SendHTML(bool led1stat);
// end of forward declarations -------------------- 




void handle_displayon() {
  DisplayStatus = HIGH;
  Serial.println("DisplayStatus ON");
}

void handle_displayoff() {
  DisplayStatus = LOW;
  Serial.println("DisplayStatus OFF");

}

String SendHTML(bool displaystatus){
  String DisplayStatusMsg;
  if (displaystatus) {
    DisplayStatusMsg = "ON BABY!";
  } else {
    DisplayStatusMsg = "OFF!";
  }
  String ptr = "<!DOCTYPE html> <html> ";
  ptr += "LED Matrix Display status is: " + DisplayStatusMsg;
  ptr += "</html>";
  return ptr;
}

void setup()
{
  Serial.begin(115200);
   // init FastLED display
  delay( 500 ); // power-up safety delay
  FastLED.addLeds<LED_TYPE, LED_PIN, COLOR_ORDER>(leds, NUM_LEDS).setCorrection( TypicalLEDStrip );
  FastLED.setBrightness(  BRIGHTNESS );    
  FastLED.show();

  // connect devboard to wifi
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  // WiFi.begin();
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


  // event handlers (for certain URLs) 
  // for now, we use this to turn on/off our LED Matrix Display
  server.on("/displayon", handle_displayon);
  server.on("/displayoff", handle_displayoff);
  
  // start web server
  server.begin(); 

}

int hue=0;
void loop()
{
  server.handleClient();
  if (DisplayStatus)
  {
    hue++;
    fill_rainbow( leds, NUM_LEDS, hue, 1);
  } else {
    for (int i=0; i<=NUM_LEDS; i++){
      leds[i] = CRGB::Black;
    }
  }
  delay(5);
  FastLED.show();
}