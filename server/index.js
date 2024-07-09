import csvtojson from "csvtojson";
import { createReadStream } from "node:fs";
import { createServer } from "node:http";
import { Readable, Transform } from "node:stream";
import { TransformStream, WritableStream } from "node:stream/web";

const PORT = 3000;
createServer(async (request, response) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "*",
    "Access-Control-Max-Age": 2592000,
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") {
    res.writeHead(204, headers);
    response.end();
    return;
  }

  let items = 0;
  request.once("close", (_) => console.log("connection was closed", items));

  Readable.toWeb(createReadStream("./animeflv.csv"))
    .pipeThrough(Transform.toWeb(csvtojson()))
    .pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          const data = JSON.parse(Buffer.from(chunk));

          const mappedData = {
            title: data.title,
            description: data.description,
            url_anime: data.url_anime,
          };

          controller.enqueue(JSON.stringify(mappedData).concat("\n"));
        },
      })
    )
    .pipeTo(
      new WritableStream({
        async write(chunk) {
          items++;
          response.write(chunk);
        },
        close() {
          response.end();
        },
      })
    );

  response.writeHead(200, headers);

  //response.end("ok");
})
  .listen(PORT)
  .on("listening", (_) => console.log(`Server is running at port ${PORT}`));
