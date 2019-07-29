(function initComments()
{
  function hideError()
  {
    var error = document.getElementById("comment-error");
    if (error)
      error.parentNode.removeChild(error);
  }

  function showError(text)
  {
    hideError();

    var error = document.createElement("p");
    error.id = "comment-error";
    error.className = "comments_error";
    error.textContent = text;

    var insertionPoint = document.getElementById("comment-submit");
    insertionPoint.parentNode.insertBefore(error, insertionPoint.nextSibling);

    error.scrollIntoView(true);
  }

  function showSuccess(text)
  {
    var parent = document.getElementById("comments");
    while (parent.firstChild)
      parent.removeChild(parent.firstChild);

    var message = document.createElement("p");
    message.id = "cpreview";
    message.textContent = text;
    parent.appendChild(message);
  }

  var form = document.getElementById("comments");
  if (!form)
    return;

  form.addEventListener("submit", function(event)
  {
    event.preventDefault();
    hideError();

    var url = "/comment/submit";
    if (location.hostname == "localhost")
      url = "http://localhost:5000" + url;

    var request = new XMLHttpRequest();
    request.open("POST", url);
    request.setRequestHeader("X-XMLHttpRequest", "1");
    request.addEventListener("load", function()
    {
      if (request.status != 200)
        return showError("Unexpected server response: " + request.status);

      var response;
      try
      {
        response = JSON.parse(request.responseText);
      }
      catch (e)
      {
        return showError("Invalid server response.");
      }

      if (response.error)
        return showError(response.message);

      return showSuccess(response.message);
    }, false);

    request.addEventListener("error", function()
    {
      return showError("Connection error.");
    }, false);

    request.send(new FormData(form));
  }, false);
})();
