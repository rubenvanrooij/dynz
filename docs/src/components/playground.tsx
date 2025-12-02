import { Sandpack } from "@codesandbox/sandpack-react";
import type { ComponentProps } from "react";

type PlaygroundProps = Pick<ComponentProps<typeof Sandpack>, 'files' | 'template'>;

export default function Playground({ files, template }: PlaygroundProps) {
  return <Sandpack template="react-ts" theme="auto" files={{...files, "App.tsx": {
     hidden: true, code: `
import * as d from "dynz";

const original = d.validate;

d.validate = (...args) => {
console.log('damn.')
    const res = original(...args);
    console.log("Validation result:", res);
};

import('./schema').then(() => {
    console.log("Schema loaded");
})
  
import { useState, useEffect } from "react";
import ReactJson from 'react-json-view'


export default function App(): JSX.Element {
  const [state, setState] = useState(undefined);


  useEffect(() => {
    
    d.validate = (...args) => {
      const res = original(...args);
      setState(res)
    };

    import("./schema").then(() => {
      console.log("Schema loaded")
    });
  }, []);

  if(state === undefined) {
    return <div>Loading...</div>
  }

  return <ReactJson src={state} />;
}
`,
  }}}
  
  options={{
    activeFile: "schema.ts",
    autoReload: true,
    recompileMode: 'immediate',
    showTabs: false,
    showConsole: true,
    showConsoleButton: false,
  }}
  customSetup={{
    dependencies: {
      "dynz": "latest",
      "react-json-view": "latest",
    }
  }} />;
}
