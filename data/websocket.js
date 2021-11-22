
// don't execute JS until html page is completely loaded
$(document).ready(function (e) {
    var buttonOn = document.getElementById("button-on");
    var buttonOff = document.getElementById("button-off");
    var pagestatus = document.getElementById("pagestatus");

    buttonOn.onclick = function () {
        console.log("ON Button clicked! Sending data to WS");
        if (socket.readyState == WebSocket.OPEN) {
            // format of LED Matrix data to send to server. # and commas are optional.
            ledData = "#FF0000, #00FF00, #0000FF, #FF0000, #00FF00, #0000FF, #123456, #098765 #335577 #998877, #AABBCC 834671 DF45FF 888888 229900 FF00FF ";       
            ledData += "#FF0000, #00FF00, #0000FF, #FF0000, #00FF00, #0000FF, #123456, #098765 #335577 #998877, #AABBCC 834671 DF45FF 888888 229900 FF00FF ";       
            ledData += "#FF0000, #00FF00, #0000FF, #FF0000, #00FF00, #0000FF, #123456, #098765 #335577 #998877, #AABBCC 834671 DF45FF 888888 229900 FF00FF "; 
            ledData += "#FF0000, #00FF00, #0000FF, #FF0000, #00FF00, #0000FF, #123456, #098765 #335577 #998877, #AABBCC 834671 DF45FF 888888 229900 FF00FF "; 
            ledData += "#FF0000, #00FF00, #0000FF, #FF0000, #00FF00, #0000FF, #123456, #098765 #335577 #998877, #AABBCC 834671 DF45FF 888888 229900 FF00FF ";       
            // console.log("Original Data --> " + ledData);
            ledData = ledData.replaceAll(/#/g,'');  // Cleanup Data -- remove hash
            ledData = ledData.replaceAll(/,/g,''); // remove commas
            // console.log("Data sent to WS --> " + ledData);
            socket.send(ledData);
        }
    }
    

    buttonOff.onclick = function () {
        console.log("OFF Button clicked!");
        ledData = "#000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 "; 
        ledData += "#000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 ";  
        ledData += "#000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 ";  
        ledData += "#000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 ";  
        ledData += "#000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 #000000 ";  
        ledData = ledData.replaceAll(/#/g,'');  // Cleanup Data -- remove hash
        ledData = ledData.replaceAll(/,/g,''); // remove commas     
        // console.log("Data sent to WS --> " + ledData);
        socket.send(ledData);
    }

    pagestatus.innerHTML = ""; // clear initially
});

// Websocket
if (window.WebSocket) {
    // this browser supports websocket
    console.log("websocket supported");

    // url = "ws://echo.websocket.events";  
    url = "ws://192.168.0.31";
    var socket = new WebSocket(url);
    socket.onopen = function (event) {
        console.log("Connection established.");
        pagestatus.innerHTML = url + " Connection established!";
    }

    socket.onmessage = function (event) {
        console.log("Data received!");
        pagestatus.innerHTML = "Data Received!";
        if (typeof event.data === "string") {
            // If the server has sent text data, then display it. 
            pagestatus.innerHTML = event.data;
        }
    }

    socket.onclose = function (event) {
        console.log("DEBUG onclose event: Connection closed.");
        var code = event.code;
        var reason = event.reason;
        var wasClean = event.wasClean;
        var label = document.getElementById("status-label");
        if (wasClean) {
            pagestatus.innerHTML = "Connection closed normally.";
        }
        else {
            pagestatus.innerHTML = "Connection closed with message " + reason + "(Code: " + code + ")";
        }
    }

    socket.onerror = function (event) {
        console.log("DEBUG onerror event: Error occurred.");
        // Inform the user about the error.
        pagestatus.innerHTML = "Error: " + event;
    }


} else {
    console.log("WebSockets not supported by this browser");
    alert("Your Browser do not support WebSockets!");
}