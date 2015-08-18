var client = new Dropbox.Client({ key: "4hxwutae96fhhbd" });

client.authenticate({interactive: true}, function(error, client) {
    var d;

    if (error) {
        console.log(error);

        d = document.createElement("div");
        d.innerHTML = "Authentication error - see console for details";
        document.body.appendChild(d);

        return;
    }

    if (client.isAuthenticated()) {
        window.location.href = "/dayary";
    }
    else {
        d = document.createElement("div");
        d.innerHTML = "Internal (Dropbox) error - not authenticated";
        document.body.appendChild(d);
    }
});
