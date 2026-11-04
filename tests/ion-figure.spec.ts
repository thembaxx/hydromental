import { expect, test } from "@playwright/test";

test("ion experiment supports prediction, keyboard controls and transfer", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/lab/ions");

  await expect(page.getByRole("heading", { name: "What makes an ion?" })).toBeVisible();

  const predict = page.getByRole("group", { name: "Predict ion charge" });
  await predict.getByRole("button", { name: "Negative" }).click();

  const explain = page.getByRole("button", { name: "Explain the result" });
  await expect(explain).toBeDisabled();

  const electrons = page.getByRole("slider", { name: "Electrons changed" });
  await expect(electrons).toHaveValue("0");
  await electrons.focus();
  await electrons.press("ArrowRight");
  await expect(electrons).toHaveValue("1");

  const experiment = page.getByRole("region", { name: "Experiment" });
  await expect(experiment.getByText("4 electrons")).toBeVisible();
  const model = page.getByRole("img", { name: /Lithium with 3 protons and 4 electrons/ });
  await expect(model).toBeVisible();
  await explain.click();

  await expect(page.getByRole("region", { name: "Explain" })).toBeVisible();
  await expect(page.getByText("Your prediction matched.")).toBeVisible();
  const transfer = page.getByRole("group", { name: "Apply the ion rule" });
  await transfer.getByRole("button", { name: "−1" }).click();
  await expect(page.getByText(/Review the charge rule above/)).toBeVisible();
  await transfer.getByRole("button", { name: "+1" }).click();
  await expect(page.getByText(/Correct. Oxygen has one more proton/)).toBeVisible();

  await page.getByRole("button", { name: "Reset experiment" }).click();
  await expect(page.getByRole("region", { name: "Experiment" })).toHaveCount(0);
});
