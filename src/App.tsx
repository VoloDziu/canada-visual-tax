import Decimal from "decimal.js";
import { useState } from "react";
import { ModeToggle } from "./components/mode-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";

const federalRates = [0.15, 0.205, 0.26, 0.29, 0.33];

const federalBrackets = [57375, 57375, 63132, 75532] as const;

function calculateTaxes(
  number: number,
  brackets: readonly number[],
  rates: readonly number[],
) {
  const taxPerBracket = [];
  let num = number;

  let index = 0;
  while (num > 0) {
    const bracket = brackets[index];
    const rate = rates[index];

    if (bracket) {
      taxPerBracket.push(Math.min(bracket, num) * rate);
      num = num - bracket;
    } else {
      taxPerBracket.push(num * rate);
      num = 0;
    }
    index++;
  }

  return taxPerBracket;
}

function App() {
  const [fed, setFed] = useState<number[]>([]);

  function doMath(value: string) {
    let num;
    try {
      num = new Decimal(value).toNumber();
    } catch {
      num = 0;
    }

    const taxPerBracket = calculateTaxes(num, federalBrackets, federalRates);

    setFed(taxPerBracket);
  }

  return (
    <div className="h-screen w-screen">
      <div className="border-border flex border-b px-10 py-3">
        <h1 className="flex-1 text-2xl font-bold">
          Canadian Income Tax Calculator (2025)
        </h1>

        <ModeToggle />
      </div>
      <div className="flex flex-col gap-10 px-10 py-10">
        <div className="flex flex-col gap-2">
          <Label htmlFor="income">Net Annual Income</Label>
          <Input
            type="number"
            id="income"
            onChange={(e) => doMath(e.target.value)}
          />
        </div>

        <div className="flex gap-4">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Federal Taxes</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-2 text-sm">
              <div>$0 - $57,375</div>
              <div>@ 15%</div>
              <div className="text-right">
                {fed[0]?.toLocaleString("en-CA", {
                  style: "currency",
                  currency: "CAD",
                }) ?? 0}
              </div>

              <div>$57,375 - $114,750</div>
              <div>@ 20.5%</div>
              <div className="text-right">
                {fed[1]?.toLocaleString("en-CA", {
                  style: "currency",
                  currency: "CAD",
                }) ?? 0}
              </div>

              <div>$114,750 - $177,882</div>
              <div>@ 26%</div>
              <div className="text-right">
                {fed[2]?.toLocaleString("en-CA", {
                  style: "currency",
                  currency: "CAD",
                }) ?? 0}
              </div>

              <div>$177,882 - $253,414</div>
              <div>@ 29%</div>
              <div className="text-right">
                {fed[3]?.toLocaleString("en-CA", {
                  style: "currency",
                  currency: "CAD",
                }) ?? 0}
              </div>

              <div>over $253,414</div>
              <div>@ 33%</div>
              <div className="text-right">
                {fed[4]?.toLocaleString("en-CA", {
                  style: "currency",
                  currency: "CAD",
                }) ?? 0}
              </div>

              <div className="border-border text-foreground col-span-full grid grid-cols-[1fr_auto] gap-2 border-t pt-2 text-base">
                <div className="">Total</div>
                <div className="text-right">
                  {fed
                    .reduce((a, b) => a + b, 0)
                    .toLocaleString("en-CA", {
                      style: "currency",
                      currency: "CAD",
                    })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Provincial Taxes</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Card Content</p>
            </CardContent>
          </Card>

          {/* <Card className="flex-1">
            <CardHeader>
              <CardTitle>Take Home</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Card Content</p>
            </CardContent>
          </Card> */}
        </div>
      </div>
    </div>
  );
}

export default App;
