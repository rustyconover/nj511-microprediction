// What this code does is download the latest load information and publishes to microprediction.org
import { MicroWriter, MicroWriterConfig } from "microprediction";
import { stream_write_keys } from "./write-keys";
const bent = require("bent");
const post = bent("POST");
import { ScheduledHandler } from "aws-lambda";

async function getStats(): Promise<[string, number][]> {
  const good_ids = [];
  const known_trips = new Set();

  const results: Array<[string, number]> = [];

  const ids2 = [24, 85, 2, 29, 5, 62, 55, 65];

  for (const n of ids2) {
    const content = await post(
      `https://drweb.511nj.org/api/client/populartravelroute/getTileData?SectorMasterId=${n}&rnd=${Math.random()}`
    );
    const body = await content.json();
    //    console.log(body);

    let had_unique = false;

    for (const trip of body.Data) {
      if (!known_trips.has(trip.TripName)) {
        known_trips.add(trip.TripName);

        const [hours, minutes] = trip.TTString.split(/:/).map((v: string) =>
          parseInt(v || "0", 10)
        );

        const total = hours * 60 + minutes;
        had_unique = true;

        trip.TripName = trip.TripName.replace(/Int6/, "Int 6");

        trip.TripName = trip.TripName.replace(/Int/g, "NJ Turnpike Exit")
          .replace(/Exiterchange/g, "Exit")
          .toLowerCase()
          .replace(/ /g, "_");

        results.push([trip.TripName, total]);
      }
    }

    if (had_unique) {
      good_ids.push(n);
    }
  }
  return results;
}

async function pushValues() {
  const records = await getStats();

  const writes = [];
  for (const [name, value] of records) {
    let config = await MicroWriterConfig.create({
      write_key: stream_write_keys[name],
    });
    const writer = new MicroWriter(config);
    console.log("Writing", name, value);
    writes.push(writer.set(`traffic-nj511-minutes-${name}.json`, value));
  }
  await Promise.all(writes);
}

export const handler: ScheduledHandler<any> = async (event) => {
  console.log("Fetching data");
  await Promise.all([pushValues()]);
};
