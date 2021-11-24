
// don't execute JS until html page is completely loaded
$(document).ready(function (e) {
    var buttonOff = document.getElementById("button-off");
    var buttonSingle = document.getElementById("button-pixel");
    var selectX = document.getElementById("x");
    var selectY = document.getElementById("y");
    var pagestatus = document.getElementById("pagestatus");
    var mytable = document.querySelector("#mytable");

    // add event handler to table, each table cell is unique due to id 
    const cells = mytable.addEventListener("mouseover", function (event) {
        var td = event.target;
        while (td !== this && !td.matches("td")) {
            td = td.parentNode;
        }
        if (td === this) {
            // console.log("No table cell found");
            // do nothing, not a table cell
        } else {
            id = td.id;     // get id of this table cell 
            id_split = id.split(',');   // split id to x, y coords
            ledx = parseInt(id_split[0]);
            ledy = parseInt(id_split[1]);
            var hexcolor = colorPicker.color.hexString;
            ledData = 'P' + ledx.toString(10) + ' ' + ledy.toString(10) + ' ' + hexcolor;
            ledData = ledData.replaceAll(/#/g, '');  // Cleanup Data -- remove hash
            ledData = ledData.replaceAll(/,/g, ''); // remove commas     
            // console.log("Data sent to WS --> " + ledData);
            td.style.backgroundColor = hexcolor;
            socket.send(ledData);
        }
    });




    // start color picker
    var colorPicker = new iro.ColorPicker("#picker", {
        width: 200,     // Set the size of the color picker
        color: "#f00"   // Set the initial color to pure red
    });

    // update color of button if color change
    colorPicker.on('color:change', function(color) {
        // log the current color as a HEX string
        buttonSingle.style.background=color.hexString;
    });

      

    buttonOff.onclick = function () {
        if (socket.readyState == WebSocket.OPEN) {
            socket.send("C");       // 'C' websocket message is CLEAR, turn off ALL LEDs in led array
            // change all cells in table to gray color
            tablecells = document.querySelectorAll("#mytable td").forEach(function(cell){
                cell.style.backgroundColor = "#000";
            });
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
        // change bkgd color of table cell based on x,y position (ID)
        cellid = ledx +","+ledy;
        cell = document.getElementById(cellid).style.backgroundColor = hexcolor;
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
        // reconnect!
        url = "ws://192.168.0.31";
        var socket = new WebSocket(url);
        socket.onopen = function (event) {
            console.log("Connection established.");
            pagestatus.innerHTML = url + " Re-Connect established!";
        }
    }

    socket.onerror = function (event) {
        console.log("DEBUG onerror event: Error occurred.");
        // Inform the user about the error.
        pagestatus.innerHTML = "Error: " + event;
    }

    let timerId = 0; 

    function keepAlive(timeout = 20000) { 
        if (socket.readyState == socket.OPEN) {  
            socket.send('');  
        }  
        timerId = setTimeout(keepAlive, timeout);  
    }

    // keep alive (heartbeat)
    keepAlive();


} else {
    console.log("WebSockets not supported by this browser");
    alert("Your Browser do not support WebSockets!");
}

