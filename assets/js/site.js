function mountGame(buttonEl) {
  var shell = document.getElementById("game-shell");
  var src = buttonEl.getAttribute("data-embed-src");

  if (!shell || !src || shell.getAttribute("data-mounted") === "1") {
    return;
  }

  var iframe = document.createElement("iframe");
  iframe.src = src;
  iframe.title = "2048 game embed";
  iframe.loading = "lazy";
  iframe.allowFullscreen = true;
  iframe.style.width = "100%";
  iframe.style.minHeight = "420px";
  iframe.style.border = "0";
  iframe.style.borderRadius = "12px";

  shell.innerHTML = "";
  shell.appendChild(iframe);
  shell.setAttribute("data-mounted", "1");
}

document.addEventListener("click", function (event) {
  var target = event.target;
  if (target && target.classList.contains("play-now")) {
    mountGame(target);
  }
});
