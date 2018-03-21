// Strict Mode is a new feature in ECMAScript 5 that allows you to place a program, or a function, in a "strict" operating context.
// This strict context prevents certain actions from being taken and throws more exceptions.
// And:

// Strict mode helps out in a couple ways:

// It catches some common coding bloopers, throwing exceptions.
// It prevents, or throws errors, when relatively "unsafe" actions are taken (such as gaining access to the global object).
// It disables features that are confusing or poorly thought out.

// When the below is set to true, the comment below enables use strict globally

/*jshint strict: false */

(function () {
    'use strict';
    const elLogo = document.getElementById("logo");
    const elCar = document.getElementById("car");
    const elDate = document.getElementById("date");
    var loaded = false;
    var aud = new Audio();

    const tlLogo = new TimelineMax({
        paused: true
    });

    tlLogo
        // .to(elCar, 1, {
        //     scale: 1,
        //     x: 600,
        //     ease: Power0.easeNone
        // })
        .to(
            ".old-path",
            .6, {
                fill: "#ed1f24",
                ease: Sine.easeOut,
                morphSVG: {
                    shape: ".new-path"
                }
            },
            "-=1"
        )
        .to(elDate, 1.2, {
                scale: 1,
                autoAlpha: 1
            },
            "+=2"
        );
    // elLogo.addEventListener("mouseup", function () {
    // setTimeout(function () {
        //     tlLogo.play(0);
        //     audio.play();
        // }, 1000);
        
        aud.addEventListener('loadeddata', function () {
            setTimeout(function () {
                loaded = true;
                aud.play();
                tlLogo.play(0);        
                }, 500);
    }, false);

    aud.src = 'f1.mp3';
    // elLogo.addEventListener("mouseleave", function () {
    //     // tlLogo.reverse();
    // });

}());

(function () {
    // this anonymous function is sloppy...
}());