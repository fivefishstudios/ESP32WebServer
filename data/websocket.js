
// don't execute JS until html page is completely loaded
$(document).ready(function (e) {
    var buttonOn = document.getElementById("button-on");
    var buttonOff = document.getElementById("button-off");
    var buttonSingle = document.getElementById("button-pixel");
    var selectX = document.getElementById("x");
    var selectY = document.getElementById("y");
    var pagestatus = document.getElementById("pagestatus");

    // start color picker
    var colorPicker = new iro.ColorPicker("#picker", {
        // Set the size of the color picker
        width: 240,
        // Set the initial color to pure red
        color: "#f00"
    });

    // update color of button if color change
    colorPicker.on('color:change', function(color) {
        // log the current color as a HEX string
        buttonSingle.style.background=color.hexString;
    });

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
    } // buttonOn 
    

    buttonOff.onclick = function () {
        console.log("OFF Button clicked!");
        if (socket.readyState == WebSocket.OPEN) {
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
    } // buttonOff


    buttonSingle.onclick = function () {
        console.log("Turn ON single pixel Button clicked!");
        // Message Format: Pxx yy rrggbb
        if (socket.readyState == WebSocket.OPEN) {
            // get X and Y values from select form
            ledx = selectX.value;
            ledy = selectY.value;
            var hexcolor = colorPicker.color.hexString;
            ledData = 'P' + ledx.toString(16) + ' ' + ledy.toString(16) + ' ' + hexcolor ; 
            ledData = ledData.replaceAll(/#/g,'');  // Cleanup Data -- remove hash
            ledData = ledData.replaceAll(/,/g,''); // remove commas     
            console.log("Data sent to WS --> " + ledData);
            socket.send(ledData);
        }
    } // buttonSingle 

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