import Decimal from "decimal.js";
import { useEffect, useState } from "react";
import { ModeToggle } from "./components/mode-toggle";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./components/ui/accordion";
import { Card, CardContent } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { cn } from "./lib/utils";

const federalRates = [0.15, 0.205, 0.26, 0.29, 0.33];
const federalBrackets = [57375, 57375, 63132, 75532];

const ONRates = [0.0505, 0.0915, 0.1116, 0.1216, 0.1316];
const ONBrackets = [52886, 52889, 44225, 26752];

const MbRates = [0.108, 0.1275, 0.174];
const MbBrackets = [47564, 53636];

const SKRates = [0.105, 0.125, 0.145];
const SKBrackets = [53463, 99287];

const cppExempt = 3500;
const cppBrackets = [67800, 9900];
const cppRates = [0.0595, 0.04];

const provinceCodeMap = {
  NF: "Newfoundland and Labrador",
  PE: "Prince Edward Island",
  NS: "Nova Scotia",
  NB: "New Brunswick",
  ON: "Ontario",
  MB: "Manitoba",
  SK: "Saskatchewan",
  AB: "Alberta",
  BC: "British Columbia",
  YK: "Yukon",
  NT: "Northwest Territories",
  NV: "Nunavut",
};

function calculateTaxes(
  income: number,
  brackets: readonly number[],
  rates: readonly number[],
) {
  const taxPerBracket = [];
  let num = income;

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

function calculateCpp(income: number): number[] {
  const cpp: number[] = [];

  let num = income - cppExempt;

  for (const [index, bracket] of cppBrackets.entries()) {
    if (num > 0) {
      cpp.push(Math.min(bracket, num) * cppRates[index]);
    } else {
      cpp.push(0);
    }

    num = num - bracket;
  }

  return cpp;
}

function sumUpTo(brackets: number[], index: number) {
  let sum = 0;
  for (let i = 0; i < index; i++) {
    sum += brackets[i];
  }

  return sum;
}

function getBracketLabel(brackets: number[], index: number) {
  if (index === 0) {
    return `before ${brackets[index].toLocaleString("en-CA", {
      style: "currency",
      currency: "CAD",
    })}`;
  }

  if (index === brackets.length) {
    return `over ${sumUpTo(brackets, index).toLocaleString("en-CA", {
      style: "currency",
      currency: "CAD",
    })}`;
  }

  return `${sumUpTo(brackets, index).toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
  })} - ${sumUpTo(brackets, index + 1).toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
  })}`;
}

function getProvinceBrackets(province: keyof typeof provinceCodeMap) {
  switch (province) {
    case "ON":
      return ONBrackets;
    case "MB":
      return MbBrackets;
    case "SK":
      return SKBrackets;
  }

  throw new Error("Province not found");
}

function getProvinceRates(province: keyof typeof provinceCodeMap) {
  switch (province) {
    case "ON":
      return ONRates;
    case "MB":
      return MbRates;
    case "SK":
      return SKRates;
  }

  throw new Error("Province not found");
}

function TaxesTable(props: {
  taxes: number[];
  brackets: number[];
  rates: number[];
  className: string;
}) {
  return (
    <div
      className={cn("grid grid-cols-[auto_1fr_auto] gap-4", props.className)}
    >
      {props.rates.map((rate, index) => (
        <div key={index} className="col-span-full grid grid-cols-subgrid">
          <div>{getBracketLabel(props.brackets, index)}</div>
          <div>@ {(rate * 100).toFixed(2)}%</div>
          <div className="text-right">
            {props.taxes[index]?.toLocaleString("en-CA", {
              style: "currency",
              currency: "CAD",
            }) ?? 0}
          </div>
        </div>
      ))}
    </div>
  );
}

function CppTable(props: { cpp: number[]; className?: string }) {
  return (
    <div
      className={cn("grid grid-cols-[auto_1fr_auto] gap-4", props.className)}
    >
      <div>
        $0.00 -{" "}
        {cppExempt.toLocaleString("en-CA", {
          style: "currency",
          currency: "CAD",
        })}
      </div>
      <div></div>
      <div className="text-right">Exempt</div>

      <div>
        {cppExempt.toLocaleString("en-CA", {
          style: "currency",
          currency: "CAD",
        })}{" "}
        -{" "}
        {(cppBrackets[0] + cppExempt).toLocaleString("en-CA", {
          style: "currency",
          currency: "CAD",
        })}
      </div>
      <div>@ {(cppRates[0] * 100).toFixed(2)}%</div>
      <div className="text-right">
        {props.cpp[0]?.toLocaleString("en-CA", {
          style: "currency",
          currency: "CAD",
        }) ?? 0}
      </div>

      <div>
        {(cppBrackets[0] + cppExempt).toLocaleString("en-CA", {
          style: "currency",
          currency: "CAD",
        })}{" "}
        -{" "}
        {(cppBrackets[0] + cppBrackets[1] + cppExempt).toLocaleString("en-CA", {
          style: "currency",
          currency: "CAD",
        })}
      </div>
      <div>@ {(cppRates[1] * 100).toFixed(2)}%</div>
      <div className="text-right">
        {props.cpp[1]?.toLocaleString("en-CA", {
          style: "currency",
          currency: "CAD",
        }) ?? 0}
      </div>
    </div>
  );
}

function App() {
  const [incomeValue, setIncomeValue] = useState<string>("100000");
  const [fed, setFed] = useState<number[]>([]);
  const [prov, setProv] = useState<number[]>([]);
  const [income, setIncome] = useState<number>(0);
  const [cpp, setCpp] = useState<number[]>([]);
  const [province, setProvince] = useState<keyof typeof provinceCodeMap>("ON");

  useEffect(() => {
    let num;
    try {
      num = new Decimal(incomeValue).toNumber();
    } catch {
      num = 0;
    }

    setIncome(num);

    setFed(calculateTaxes(num, federalBrackets, federalRates));
    setCpp(calculateCpp(num));

    switch (province) {
      case "ON":
        setProv(calculateTaxes(num, ONBrackets, ONRates));
        break;
      case "MB":
        setProv(calculateTaxes(num, MbBrackets, MbRates));
        break;
      case "SK":
        setProv(calculateTaxes(num, SKBrackets, SKRates));
        break;
    }
  }, [incomeValue, province]);

  return (
    <div className="h-screen w-screen">
      <div className="border-border flex border-b px-10 py-3">
        <h1 className="flex-1 text-2xl font-bold">
          Canadian Income Tax Calculator (2025)
        </h1>

        <ModeToggle />
      </div>

      <div className="mx-auto flex max-w-[800px] justify-center gap-10 px-4 py-10">
        <div className="flex basis-1/3 flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="province">Province</Label>
            <Select
              value={province}
              onValueChange={(value) =>
                setProvince(value as keyof typeof provinceCodeMap)
              }
            >
              <SelectTrigger className="w-full" id="province">
                <SelectValue placeholder="Select a province" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ON">Ontario</SelectItem>
                <SelectItem value="MB">Manitoba</SelectItem>
                <SelectItem value="SK">Saskatchewan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="income">Gross Annual Income</Label>
            <Input
              value={incomeValue}
              type="number"
              className="shrink-0"
              id="income"
              onChange={(e) => setIncomeValue(e.target.value)}
            />
          </div>
        </div>

        <div className="flex basis-2/3 flex-col gap-4">
          <Card className="py-2">
            <CardContent>
              <div className="border-border flex items-center border-b py-4 pr-8 font-medium">
                <div>Gross annual income</div>

                <div className="flex-1 text-right">
                  {income.toLocaleString("en-CA", {
                    style: "currency",
                    currency: "CAD",
                  })}
                </div>
              </div>

              <Accordion type="multiple" className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-base">
                    <div>Federal taxes</div>

                    <div className="flex-1 text-right">
                      {fed
                        .reduce((acc, curr) => acc - curr, 0)
                        .toLocaleString("en-CA", {
                          style: "currency",
                          currency: "CAD",
                        })}
                    </div>
                  </AccordionTrigger>

                  <AccordionContent>
                    <TaxesTable
                      taxes={fed}
                      brackets={federalBrackets}
                      rates={federalRates}
                      className="text-muted-foreground pr-8 text-sm"
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-base">
                    <div>Provincial taxes ({provinceCodeMap[province]})</div>

                    <div className="flex-1 text-right">
                      {prov
                        .reduce((acc, curr) => acc - curr, 0)
                        .toLocaleString("en-CA", {
                          style: "currency",
                          currency: "CAD",
                        })}
                    </div>
                  </AccordionTrigger>

                  <AccordionContent>
                    <TaxesTable
                      taxes={prov}
                      brackets={getProvinceBrackets(province)}
                      rates={getProvinceRates(province)}
                      className="text-muted-foreground pr-8 text-sm"
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-base">
                    <div>Canada Pension Plan (CPP)</div>

                    <div className="flex-1 text-right">
                      {cpp
                        .reduce((acc, curr) => acc - curr, 0)
                        .toLocaleString("en-CA", {
                          style: "currency",
                          currency: "CAD",
                        })}
                    </div>
                  </AccordionTrigger>

                  <AccordionContent>
                    <CppTable
                      cpp={cpp}
                      className="text-muted-foreground pr-8 text-sm"
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="border-border flex items-center border-t py-4 pr-8 font-medium">
                <div>Net annual income</div>

                <div className="flex-1 text-right">
                  {(
                    income -
                    fed.reduce((acc, curr) => acc + curr, 0) -
                    prov.reduce((acc, curr) => acc + curr, 0)
                  )
                    // - cpp
                    .toLocaleString("en-CA", {
                      style: "currency",
                      currency: "CAD",
                    })}
                </div>
              </div>

              {/* <div className="text-muted-foreground flex items-center pr-8 pb-4 text-sm font-medium">
                  <div>Net monthly income</div>

                  <div className="flex-1 text-right">
                    {(
                      income - 
                          fed.reduce((acc, curr) => acc + curr, 0) -
                            prov.reduce((acc, curr) => acc + curr, 0) - 
                              cpp
                        )
                    ).toLocaleString("en-CA", {
                      style: "currency",
                      currency: "CAD",
                    })}
                  </div>
                </div> */}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default App;
