require(["gitbook"], function(gitbook) {
    MathJax.Hub.Config({
        tex2jax: {inlineMath: [['$','$'], ['\\(','\\)']]},
        'HTML-CSS': {
        	availableFonts: ["TeX"]
        }
    });


    gitbook.events.bind("page.change", function() {
        MathJax.Hub.Typeset()
    });
});

