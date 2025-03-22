import { Button } from "./components/ui/button";

function App() {
  return (
    <div className="grid h-screen w-screen place-content-center">
      <div className="border border-amber-600 p-10">
        <div>I am here</div>

        <Button>I am a button!</Button>
      </div>
    </div>
  );
}

export default App;
