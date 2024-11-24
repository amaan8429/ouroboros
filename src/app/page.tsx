"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const API_URL = "https://python-orubs.onrender.com/"; // Replace with your Python backend URL

export default function ExamPaperGenerator() {
  const [assignments, setAssignments] = useState<{
    [key: string]: File | null;
  }>({
    assignment1: null,
    assignment2: null,
    assignment3: null,
    assignment4: null,
    assignment5: null,
  });
  const [urls, setUrls] = useState<string[]>([""]);
  const [notes, setNotes] = useState<string>("");
  const [examType, setExamType] = useState<string>("sessional1");
  const [paperFormat, setPaperFormat] = useState<string>("");
  const [generatedPaper, setGeneratedPaper] = useState<string | null>(null);
  const [extractedTexts, setExtractedTexts] = useState<
    Array<{ filename: string; text: string }>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("generate");

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    assignmentKey: string
  ) => {
    if (event.target.files && event.target.files[0]) {
      setAssignments((prev) => ({
        ...prev,
        [assignmentKey]: event.target.files![0],
      }));
    }
  };

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const addUrlField = () => {
    setUrls([...urls, ""]);
  };

  const handleGeneratePaper = async () => {
    setError(null);
    setGeneratedPaper(null);
    setExtractedTexts([]);
    setIsLoading(true);

    const pdfs = await Promise.all(
      Object.values(assignments)
        .filter((file): file is File => file !== null)
        .map(async (file) => {
          return {
            filename: file.name,
            content: await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            }),
          };
        })
    );

    const payload = {
      exam_type: examType,
      paper_format: paperFormat,
      pdfs,
      urls: urls.filter((url) => url.trim() !== ""),
      notes,
    };

    try {
      const response = await fetch(`${API_URL}/generate_paper`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to generate exam paper");
      const data = await response.json();
      setGeneratedPaper(data.paper);
      setExtractedTexts(data.extracted_texts);
    } catch (error) {
      console.error("Error generating paper:", error);
      setError("Failed to generate exam paper. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Exam Paper Generator</CardTitle>
          <CardDescription>
            Upload PDFs, add URLs, or enter notes to generate exam papers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="generate">Generate Paper</TabsTrigger>
              <TabsTrigger value="extracted">Extracted Text</TabsTrigger>
            </TabsList>
            <TabsContent value="generate">
              <div className="space-y-4">
                {[
                  "assignment1",
                  "assignment2",
                  "assignment3",
                  "assignment4",
                  "assignment5",
                ].map((key) => (
                  <div key={key}>
                    <Label
                      htmlFor={`file-upload-${key}`}
                    >{`Assignment ${key.slice(-1)} (PDF)`}</Label>
                    <Input
                      id={`file-upload-${key}`}
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileUpload(e, key)}
                      className="mt-1"
                    />
                    {assignments[key] && (
                      <p className="text-sm text-green-600 mt-1">
                        File uploaded: {assignments[key]?.name}
                      </p>
                    )}
                  </div>
                ))}
                {urls.map((url, index) => (
                  <div key={index}>
                    <Label htmlFor={`url-${index}`}>{`URL ${index + 1}`}</Label>
                    <Input
                      id={`url-${index}`}
                      type="url"
                      value={url}
                      onChange={(e) => handleUrlChange(index, e.target.value)}
                      className="mt-1"
                    />
                  </div>
                ))}
                <Button onClick={addUrlField}>Add Another URL</Button>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1"
                    rows={5}
                  />
                </div>
                <div>
                  <Label htmlFor="exam-type">Exam Type</Label>
                  <Select value={examType} onValueChange={setExamType}>
                    <SelectTrigger id="exam-type">
                      <SelectValue placeholder="Select exam type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sessional1">
                        Sessional 1 (Assignments 1-2)
                      </SelectItem>
                      <SelectItem value="sessional2">
                        Sessional 2 (Assignments 3-4)
                      </SelectItem>
                      <SelectItem value="put">PUT (All Assignments)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="paper-format">Paper Format</Label>
                  <Textarea
                    id="paper-format"
                    value={paperFormat}
                    onChange={(e) => setPaperFormat(e.target.value)}
                    className="mt-1"
                    rows={5}
                    placeholder="Enter the desired paper format here..."
                  />
                </div>
                <Button onClick={handleGeneratePaper} disabled={isLoading}>
                  {isLoading ? "Generating..." : "Generate Exam Paper"}
                </Button>
                {error && (
                  <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {generatedPaper && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Generated Exam Paper</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="whitespace-pre-wrap">
                        {generatedPaper}
                      </pre>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            <TabsContent value="extracted">
              <Accordion type="single" collapsible className="w-full">
                {extractedTexts.map((item, index) => (
                  <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger>{item.filename}</AccordionTrigger>
                    <AccordionContent>
                      <pre className="whitespace-pre-wrap">{item.text}</pre>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
