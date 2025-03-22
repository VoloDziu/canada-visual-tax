import { ModeToggle } from "./components/mode-toggle";
import { Button } from "./components/ui/button";

function App() {
  return (
    <div className="h-screen w-screen">
      <div className="flex px-10 py-3">
        <h1 className="flex-1 text-2xl font-bold">
          Canadian Income Tax Calculator
        </h1>

        <ModeToggle />
      </div>
      <div className="p-10">
        <Button>I am a button!</Button>
      </div>
    </div>
  );
}

export default App;
