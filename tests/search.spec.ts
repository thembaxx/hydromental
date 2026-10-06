import { expect, test } from "@playwright/test";
import { searchElements } from "../lib/search";

test("element search ranks identities, spelling variants and typo corrections", () => {
  expect(searchElements("Fe")[0]?.z).toBe(26);
  expect(searchElements("  oxygen ")[0]?.z).toBe(8);
  expect(searchElements("26").map((element) => element.z)).toEqual([26]);
  expect(searchElements("aluminum")[0]?.z).toBe(13);
  expect(searchElements("sulphur")[0]?.z).toBe(16);
  expect(searchElements("cesium")[0]?.z).toBe(55);
  expect(searchElements("oxgyen")[0]?.z).toBe(8);
  expect(searchElements("hydrogn")[0]?.z).toBe(1);
  expect(searchElements("unobtainium")).toEqual([]);
  expect(searchElements("119")).toEqual([]);
});

test("element search honors family filters and guards unbounded input", () => {
  expect(searchElements("", "g")).toHaveLength(7);
  expect(searchElements("Ne", "g")[0]?.z).toBe(10);
  expect(searchElements("Fe", "g")).toEqual([]);
  expect(searchElements("noble gas").every((element) => element.c === "g")).toBe(true);
  expect(searchElements("x".repeat(10_000))).toEqual([]);
});
