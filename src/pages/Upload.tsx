import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Link as LinkIcon, Brain, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Client } from "@gradio/client";

const UploadPage = () => {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setImageFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setImageUrl("");
      } else {
        toast.error("Please upload an image file");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setImageUrl("");
    }
  };

  const handleUrlSubmit = () => {
    if (imageUrl.trim()) {
      setPreviewUrl(imageUrl);
      setImageFile(null);
    }
  };

  // Only the prediction-related changes shown

const handlePredict = async () => {
  if (!previewUrl && !imageFile) {
    toast.error("Please upload or provide an image URL first");
    return;
  }

  setIsLoading(true);
  try {
    console.log("Connecting to Gradio Space API...");
    const client = await Client.connect("codeToEarn/alzheimer-6class");
    console.log("Connected to Gradio Space API successfully.");

    // Prepare image (Blob or URL)
    const imageBlob = imageFile ?? (await fetch(previewUrl!).then(r => r.blob()));
    console.log("Prepared image for prediction:", imageBlob);

    // Call the Gradio predict API
    const result = await client.predict("/predict", { image: imageBlob });
    console.log("Gradio API response:", result);
    console.log("Gradio response data:", result.data);

    const predictedClass = result.data[0];
    
    // Parse confidence safely
    const rawConfidence = result.data[1]; // e.g., "73.15%"
    const confidence = parseFloat(rawConfidence?.toString().replace("%", "")) || 0;

    const explanation = result.data[2];

    const probabilities: Record<string, number> = {
      [predictedClass]: confidence,
    };

    const classDescriptions: Record<string, string> = {
      AD: "Alzheimer's Disease → Severe cognitive decline and memory loss.",
      CN: "Cognitively Normal → Healthy control group (no signs of dementia).",
      ECMI: "Early Cognitive/Mild Impairment → Early signs of cognitive decline.",
      EMCI: "Early Mild Cognitive Impairment → Mild memory problems, not dementia.",
      LCMI: "Late Cognitive/Mild Impairment → Advanced cognitive decline.",
      LMCI: "Late Mild Cognitive Impairment → More pronounced memory issues.",
    };

    const classRecommendations: Record<string, string[]> = {
      AD: ["Consult a neurologist", "Medication & therapy", "Supportive environment", "Monitor regularly"],
      CN: ["Regular health check-ups", "Healthy lifestyle", "Cognitive exercises", "Annual monitoring"],
      ECMI: ["Cognitive assessments", "Memory training", "Social interaction", "Monitor progression"],
      EMCI: ["Consult healthcare provider", "Brain-healthy habits", "Track changes", "Early intervention"],
      LCMI: ["Specialist advice", "Safety measures", "Support groups", "Monitor decline"],
      LMCI: ["Medical check-ups", "Cognitive therapies", "Maintain routines", "Monitor for dementia"],
    };

    const predictionResult = {
      imageUrl: previewUrl || URL.createObjectURL(imageBlob),
      predictedClass,
      confidence, // already a number
      probabilities,
      description: explanation || classDescriptions[predictedClass] || "",
      recommendations: classRecommendations[predictedClass] || [],
    };

    console.log("Final prediction result to be saved:", predictionResult);

    sessionStorage.setItem("predictionResult", JSON.stringify(predictionResult));
    toast.success("Prediction completed!");
    navigate("/report");
  } catch (error) {
    console.error("Prediction failed:", error);
    toast.error("Prediction failed. Please try again.");
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">NeuroScan AI</h1>
              <p className="text-xs text-muted-foreground">Alzheimer's Disease Detection</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              AI-Powered MRI Analysis
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload a brain MRI scan to analyze and detect early signs of Alzheimer's disease
              using advanced machine learning technology.
            </p>
          </div>

          {/* Upload Card */}
          <Card className="p-8 shadow-lg border-2 transition-all duration-300 hover:shadow-xl">
            <div className="space-y-6">
              {/* Drag & Drop Area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                  dragActive
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : "border-border hover:border-primary/50 hover:bg-accent/30"
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                {previewUrl ? (
                  <div className="space-y-4 animate-fade-in-scale">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg shadow-md"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPreviewUrl("");
                        setImageFile(null);
                        setImageUrl("");
                      }}
                    >
                      Remove Image
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="inline-flex p-4 bg-primary/10 rounded-full">
                      <Upload className="h-12 w-12 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">
                        Drop your MRI scan here
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        or click to browse files
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Supports: JPG, PNG, JPEG (Max 10MB)
                    </p>
                  </div>
                )}
              </div>

              {/* OR Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-card text-muted-foreground font-medium">OR</span>
                </div>
              </div>

              {/* URL Input */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Paste Image URL
                </label>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="https://example.com/mri-scan.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={handleUrlSubmit}
                    disabled={!imageUrl.trim()}
                  >
                    Load
                  </Button>
                </div>
              </div>

              {/* Predict Button */}
              <Button
                onClick={handlePredict}
                disabled={!previewUrl && !imageFile || isLoading}
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-primary-dark hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-5 w-5" />
                    Analyze MRI Scan
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default UploadPage;
