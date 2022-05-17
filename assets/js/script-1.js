function loadHTML(myDivId, url) {
    var xmlhttp;
    if (window.XMLHttpRequest)
    {
        xmlhttp = new XMLHttpRequest();
    }
    else
    {
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }

    xmlhttp.onreadystatechange = function()
    {
        if (xmlhttp.readyState == XMLHttpRequest.DONE )
        {
           if(xmlhttp.status == 200){
               document.getElementById(myDivId).innerHTML = xmlhttp.responseText;
               var allScripts = document.getElementById(myDivId).getElementsByTagName('script-1');
               for (const element of allScripts)
               {
                   eval(element.innerHTML)
               }
           }
           else {
               alert('Error');
           }
        }
    }

    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}
