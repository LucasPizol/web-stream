//import { Transform } from "node:stream";

const API_URL = "http://localhost:3000";

async function consumeAPI(signal) {
  console.log(API_URL);

  const response = await fetch(API_URL, {
    signal,
  });

  const reader = response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(parseNDJSON());

  return reader;
}
function appendToHtml(element) {
  return new WritableStream({
    write(data) {
      const div = document.createElement("div");

      element.innerHTML += data.title + "<br>";
    },
  });
}

function parseNDJSON() {
  let ndjsonBuffer = "";
  return new TransformStream({
    transform(chunck, controller) {
      ndjsonBuffer += chunck;
      const items = ndjsonBuffer.split("\n");
      items
        .slice(0, -1)
        .forEach((item) => controller.enqueue(JSON.parse(item)));

      ndjsonBuffer = items[items.length - 1];
    },

    flush(controller) {
      if (!ndjsonBuffer) return;
      controller.enqueue(JSON.parse(ndjsonBuffer));
    },
  });
}

const [start, stop, cards] = ["start", "stop", "cards"].map((id) =>
  document.getElementById(id)
);

let abortController = new AbortController();

start.addEventListener("click", async () => {
  const readable = await consumeAPI(abortController.signal);
  readable.pipeTo(appendToHtml(cards));
});

stop.addEventListener("click", () => {
  abortController.abort();
  abortController = new AbortController();
});
