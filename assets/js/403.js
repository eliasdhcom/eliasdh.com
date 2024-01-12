/**
 * @author Elias De Hondt
 * @see https://eliasdh.com
 * @since 01/01/2020
 */

TweenMax.set('#policeman',{xPercent:-50, yPercent:0, left:"50%", bottom:"0%"});
TweenMax.set('#hand',{transformOrigin:"center bottom",y:50});
TweenMax.fromTo('#hand',0.3,{rotation:-10},{rotation:10,yoyo:true,repeat:-1,ease:Power1.easeInOut});

// Play audio on page load
var isAudioPlayed = false;

function playAudio() {
    
    isAudioPlayed = true;
    const myAudio = document.getElementById("myAudio");
    myAudio.play();
}

document.body.onclick = ()=>{
    if(isAudioPlayed) return ;
    playAudio();
}