# ESP32WebServerDemo

- Don't forget to also upload files in the /data directory separately using PlatformIO "Upload Filesystem Image" 

- also, create a file called "wifi-credentials.h" in /src directory with following format  
#define ssid     "your-wifi-ssid"  
#define password "your-password"


- incorporated FastLED() to interface with my LED Display Matrix. Basic demo to turn on/off the LED display  
/displayon  
/displayoff  

- use websockets to send individual RGB data for each LED in the Display Matrix to the ESP32. MCU then updates
the display matrix via FastLED()


- Improvements in UI/UX. You can now start drawing in the middle of the board area. Disable right-click context menu in the board area. Use right-click to clear pixel to black.



