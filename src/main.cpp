#include <Arduino.h>
#include <WiFi.h>
// #include <WebServer.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
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

// this define does not seem to work
#define WEBSOCKETS_MAX_DATA_SIZE 8192

#include "wifi-credentials.h"
// WebServer server(80);

AsyncWebServer server(80);
// AsyncWebSocket ws("/ws");
AsyncWebSocket ws("/");

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

void notifyClients(uint8_t *data) {
  ws.textAll("Hello from ESP32 WebSocket Server... here's your data back -->");
  // ws.textAll(data);
}

void handleWebSocketMessage(void *arg, uint8_t *data, size_t len) {
  AwsFrameInfo *info = (AwsFrameInfo*)arg;
  if (info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT) {
    data[len] = 0;
    notifyClients(data);   
  }
}

void LightUpDisplay(void *arg, uint8_t *data, size_t len){
  // Serial.printf("\nReceived Data: %s ", data);

  // home much memory we have?
  Serial.printf("\nESP memory free: %u", ESP.getFreeHeap());
  
  // echo data back to web browser client
  ws.textAll((char *)data);     // ws.printfAll("Echo data back is %s ", data);

  // light up LEDs
  int led_ndx = 0;
  for (;;)
  {
    // data will be in format: FF0000 00FF00 0000FF FF0000 00FF00 0000FF
    // must be separated by spaces
    // convert each hex group digit into CRGB data format (long)
      char * data_end;
      const CRGB rgb = (uint32_t) strtol((const char *) data, &data_end, 16);
      
      if ((char *) data == data_end) {
          break;
      }

      // Serial.printf("\nrgb value for LED# %i is: %u", led_ndx,  rgb);
      leds[led_ndx] = rgb;    // assign color to led 
      led_ndx++;              // go to next led
      
      data = (uint8_t * ) data_end;   // this is needed to traverse the list of hex values (separated by space)
  }
  // FastLED.show();  
}


void LightUpSinglePixel(void *arg, uint8_t *data, size_t len){
  // message format: Pxx yy rrggbb 
  // echo data back to web browser client
  ws.textAll((char *)data);     // ws.printfAll("Echo data back is %s ", data);
  
  Serial.printf("\nHex data is: %u", data);

  // light up single LED, parse the x, y and rrggbb values
  // data will be in format: Pxx yy rrggbb
  uint8_t ledx;
  uint8_t ledy;
  char * data_end;

  // we start at data[1] because data]0] == 'P'
  ledx = (uint8_t) strtol((const char *) &data[1], &data_end, 10);  // decimal for X pos
  Serial.printf("\nLedX is: %i", ledx);
  data = (uint8_t * ) data_end;

  ledy = (uint8_t) strtol((const char *) &data[1], &data_end, 10);  // decimal for Y pos
  Serial.printf("\nLedY is: %i", ledy);
  data = (uint8_t * ) data_end;

  const CRGB rgb = (uint32_t) strtol((const char *) &data[1], &data_end, 16);   // hex for color value
  
  Serial.printf("\nrgb value for LED at pos %i,%i is: %u", ledx, ledy, rgb);
  
  leds[LEDArrayPosition(ledx, ledy)] = rgb;
}

void onEvent(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type,
             void *arg, uint8_t *data, size_t len) {
   // code here 
   switch (type) {
    case WS_EVT_CONNECT:
      Serial.printf("WebSocket client #%u connected from %s\n", client->id(), client->remoteIP().toString().c_str());
      break;
    case WS_EVT_DISCONNECT:
      Serial.printf("WebSocket client #%u disconnected\n", client->id());
      break;
    case WS_EVT_DATA:
      data[len]=0; //???? 
      Serial.printf("\nData received by websocket server is: %s ", data);
      // check for specific messages
      if (data[0]=='C'){   // C == clear off all LEDs
        for (int i=0; i<NUM_LEDS; i++){
          leds[i] = CRGB::Black;
        }
        break;
      } // end if 
      if (data[0]=='P'){   // P == light a single pixel
        LightUpSinglePixel(arg, data, len);
        break;
      } // end if 
      LightUpDisplay(arg, data, len);
      break;
    case WS_EVT_PONG:
    case WS_EVT_ERROR:
      break;
  }
}

void initWebSocket() {
  ws.onEvent(onEvent);
  server.addHandler(&ws);
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
  server.serveStatic("/", SPIFFS, "/").setDefaultFile("index.html");;  // create default route


  // event handlers (for certain URLs) 
  // for now, we use this to turn on/off our LED Matrix Display
  // server.on("/displayon", handle_displayon);
  // server.on("/displayoff", handle_displayoff);
  
  
  // start web sockets
  initWebSocket();

  // start web server
  server.begin(); 

}

int hue=0;
void loop()
{
  ws.cleanupClients();
  
  // if (DisplayStatus)
  // {
  //   hue++;
  //   fill_rainbow( leds, NUM_LEDS, hue, 1);
  // } else {
  //   for (int i=0; i<=NUM_LEDS; i++){
  //     leds[i] = CRGB::Black;
  //   }
  // }

  delay(5);
  FastLED.show();
}