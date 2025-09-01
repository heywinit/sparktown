"use client";

import Layout from "@/components/Layout";
import SparkdownEditor from "@/components/Editor";
import React, { useState } from "react";

export default function Home() {
  const [content, setContent] = useState(`# Welcome to Sparkdown

This is a minimal collaborative sparkdown editor with **streaming** support.

## Features
- Monaco Editor for rich text editing
- Toggle between editor and preview modes
- Side-by-side editing and preview
- Clean, minimal interface
- **Streaming markdown** support with Streamdown

### Code Example
\`\`\`javascript
function hello() {
  console.log("Hello, Sparkdown!");
}
\`\`\`

### Math Support
Inline math: $E = mc^2$

Block math:
$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

Start typing to see the magic happen!`);

  const handleContentChange = (value: string | undefined) => {
    setContent(value || "");
  };

  return (
    <Layout>
      <div className="flex flex-col h-screen w-full">
        <div className="flex-1 w-full">
          <SparkdownEditor
            content={content}
            onContentChange={handleContentChange}
          />
        </div>
      </div>
    </Layout>
  );
}
