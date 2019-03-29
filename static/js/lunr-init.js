(function initLunr()
{
  var request = new XMLHttpRequest();
  request.open("GET", "/index.json");
  request.addEventListener("load", function(event)
  {
    var documents = JSON.parse(request.responseText);
    var lookup = {};
    var index = lunr(function()
    {
      this.ref("uri");
      this.field("title");
      this.field("description");
      this.field("categories");
      this.field("content");

      for (var i = 0; i < documents.length; i++)
      {
        this.add(documents[i]);
        lookup[documents[i].uri] = documents[i];
      }
    });

    document.getElementById("search").addEventListener("submit", function(event)
    {
      event.preventDefault();

      var term = document.getElementById("search-textbox").value.trim();
      if (!term)
        return;

      var results = index.search(term);

      var target = document.getElementById("main");
      while (target.firstChild)
        target.removeChild(target.firstChild);

      var title = document.createElement("h1");
      title.textContent = "Search results for " + term + ":";
      target.appendChild(title);

      if (results.length)
      {
        for (let i = 0; i < results.length; i++)
        {
          var doc = lookup[results[i].ref];

          var par = document.createElement("p");
          par.appendChild(document.createTextNode((i + 1) + ". "));

          var link = document.createElement("a");
          link.href = doc.uri;
          link.textContent = doc.title;
          par.appendChild(link);

          target.appendChild(par);

          var par = document.createElement("p");
          par.textContent = doc.summary;
          target.appendChild(par);
        }
      }
      else
      {
        var par = document.createElement("p");
        var text = document.createElement("strong");
        text.textContent = "No results found.";
        par.appendChild(text);
        target.appendChild(par);
      }
    }, false);
  }, false);
  request.send(null);
})();
