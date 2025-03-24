import Decimal from "decimal.js";
import { useEffect, useState } from "react";
import { ModeToggle } from "./components/mode-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";

const federalRates = [0.15, 0.205, 0.26, 0.29, 0.33];
const federalBrackets = [57375, 57375, 63132, 75532];

const ONRates = [0.0505, 0.0915, 0.1116, 0.1216, 0.1316];
const ONBrackets = [52886, 52889, 44225, 26752];

const MbRates = [0.108, 0.1275, 0.174];
const MbBrackets = [47564, 53636];

const SKRates = [0.105, 0.125, 0.145];
const SKBrackets = [53463, 99287];

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
  title: string;
  taxes: number[];
  brackets: number[];
  rates: number[];
}) {
  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
      </CardHeader>

      <CardContent className="text-muted-foreground grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-2 text-sm">
        {props.rates.map((rate, index) => (
          <>
            <div>{getBracketLabel(props.brackets, index)}</div>
            <div>@ {(rate * 100).toFixed(2)}%</div>
            <div className="text-right">
              {props.taxes[index]?.toLocaleString("en-CA", {
                style: "currency",
                currency: "CAD",
              }) ?? 0}
            </div>
          </>
        ))}

        <div className="border-border text-foreground col-span-full grid grid-cols-[1fr_auto] gap-2 border-t pt-2 text-base">
          <div className="">Total</div>
          <div className="text-right">
            {props.taxes
              .reduce((a, b) => a + b, 0)
              .toLocaleString("en-CA", {
                style: "currency",
                currency: "CAD",
              })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryAnnual(props: {
  federalTaxes: number[];
  provincialTaxes: number[];
  income: string;
}) {
  let incomeNumeric;
  try {
    incomeNumeric = new Decimal(props.income).toNumber();
  } catch {
    incomeNumeric = 0;
  }

  const federalTaxes = props.federalTaxes.reduce((a, b) => a + b, 0);
  const provincialTaxes = props.provincialTaxes.reduce((a, b) => a + b, 0);

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Annual Summary</CardTitle>
      </CardHeader>

      <CardContent className="text-muted-foreground grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 text-sm">
        <div>Net income</div>
        <div className="text-right">
          {incomeNumeric.toLocaleString("en-CA", {
            style: "currency",
            currency: "CAD",
          })}
        </div>

        <div>Federal taxes</div>
        <div className="text-right">
          {federalTaxes.toLocaleString("en-CA", {
            style: "currency",
            currency: "CAD",
          })}
        </div>

        <div>Provincial taxes</div>
        <div className="text-right">
          {provincialTaxes.toLocaleString("en-CA", {
            style: "currency",
            currency: "CAD",
          })}
        </div>

        <div className="border-border text-foreground col-span-full grid grid-cols-[1fr_auto] gap-2 border-t pt-2 text-base">
          <div className="">Post-tax income</div>
          <div className="text-right">
            {(incomeNumeric - federalTaxes - provincialTaxes).toLocaleString(
              "en-CA",
              {
                style: "currency",
                currency: "CAD",
              },
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryMonthly(props: {
  federalTaxes: number[];
  provincialTaxes: number[];
  income: string;
}) {
  let incomeNumeric;
  try {
    incomeNumeric = new Decimal(props.income).div(12).toNumber();
  } catch {
    incomeNumeric = 0;
  }

  const federalTaxes = props.federalTaxes.reduce((a, b) => a + b, 0) / 12;
  const provincialTaxes = props.provincialTaxes.reduce((a, b) => a + b, 0) / 12;

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Monthly Summary</CardTitle>
      </CardHeader>

      <CardContent className="text-muted-foreground grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 text-sm">
        <div>Net income</div>
        <div className="text-right">
          {incomeNumeric.toLocaleString("en-CA", {
            style: "currency",
            currency: "CAD",
          })}
        </div>

        <div>Federal taxes</div>
        <div className="text-right">
          {federalTaxes.toLocaleString("en-CA", {
            style: "currency",
            currency: "CAD",
          })}
        </div>

        <div>Provincial taxes</div>
        <div className="text-right">
          {provincialTaxes.toLocaleString("en-CA", {
            style: "currency",
            currency: "CAD",
          })}
        </div>

        <div className="border-border text-foreground col-span-full grid grid-cols-[1fr_auto] gap-2 border-t pt-2 text-base">
          <div className="">Post-tax income</div>
          <div className="text-right">
            {(incomeNumeric - federalTaxes - provincialTaxes).toLocaleString(
              "en-CA",
              {
                style: "currency",
                currency: "CAD",
              },
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function App() {
  const [income, setIncome] = useState<string>("");
  const [epb, setEpb] = useState<string>("");
  const [fed, setFed] = useState<number[]>([]);
  const [prov, setProv] = useState<number[]>([]);
  const [province, setProvince] = useState<keyof typeof provinceCodeMap>("ON");

  useEffect(() => {
    let num;
    try {
      num = new Decimal(income).toNumber();
    } catch {
      num = 0;
    }

    let epbNum;
    try {
      epbNum = new Decimal(epb).mul(12).toNumber();
    } catch {
      epbNum = 0;
    }

    const taxPerBracket = calculateTaxes(
      num + epbNum,
      federalBrackets,
      federalRates,
    );

    switch (province) {
      case "ON":
        setProv(calculateTaxes(num + epbNum, ONBrackets, ONRates));
        break;
      case "MB":
        setProv(calculateTaxes(num + epbNum, MbBrackets, MbRates));
        break;
      case "SK":
        setProv(calculateTaxes(num + epbNum, SKBrackets, SKRates));
        break;
    }

    setFed(taxPerBracket);
  }, [epb, income, province]);

  return (
    <div className="h-screen w-screen">
      <div className="border-border flex border-b px-10 py-3">
        <h1 className="flex-1 text-2xl font-bold">
          Canadian Income Tax Calculator (2025)
        </h1>

        <ModeToggle />
      </div>

      <div className="mx-auto flex max-w-[300px] flex-col gap-10 px-4 py-10">
        <div className="flex flex-col gap-4">
          <Select
            value={province}
            onValueChange={(value) =>
              setProvince(value as keyof typeof provinceCodeMap)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a province" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ON">Ontario</SelectItem>
              <SelectItem value="MB">Manitoba</SelectItem>
              <SelectItem value="SK">Saskatchewan</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex flex-col gap-1">
            <Label htmlFor="income">Net Annual Income</Label>
            <Input
              value={income}
              type="number"
              className="shrink-0"
              id="income"
              onChange={(e) => setIncome(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="epb">Taxable benefits</Label>
            <Input
              value={epb}
              type="number"
              className="shrink-0"
              id="epb"
              onChange={(e) => setEpb(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto mb-6 flex max-w-[1000px] gap-4 px-4">
        <TaxesTable
          title="Federal Taxes"
          taxes={fed}
          brackets={federalBrackets}
          rates={federalRates}
        />

        <TaxesTable
          title={`Provincial Taxes (${provinceCodeMap[province]})`}
          taxes={prov}
          brackets={getProvinceBrackets(province)}
          rates={getProvinceRates(province)}
        />
      </div>

      <div className="mx-auto flex max-w-[800px] gap-4 px-4">
        <SummaryAnnual
          federalTaxes={fed}
          provincialTaxes={prov}
          income={income}
        />
        <SummaryMonthly
          federalTaxes={fed}
          provincialTaxes={prov}
          income={income}
        />
      </div>
    </div>
  );
}

export default App;
