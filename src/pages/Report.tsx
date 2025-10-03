import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Download, ArrowLeft, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface PredictionResult {
  imageUrl: string;
  predictedClass: string;
  confidence: number;
  probabilities: {
    [key: string]: number;
  };
  description: string;
  recommendations: string[];
}

const classInfo: { [key: string]: { name: string; severity: "low" | "medium" | "high" } } = {
  AD: { name: "Alzheimer's Disease", severity: "high" },
  CN: { name: "Cognitively Normal", severity: "low" },
  EMCI: { name: "Early Mild Cognitive Impairment", severity: "medium" },
  LMCI: { name: "Late Mild Cognitive Impairment", severity: "high" },
  ECMI: { name: "Early Cognitive/Mild Impairment", severity: "medium" },
  LCMI: { name: "Late Cognitive/Mild Impairment", severity: "high" },
};

const ReportPage = () => {
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const savedPrediction = sessionStorage.getItem("predictionResult");
    if (savedPrediction) {
      setPrediction(JSON.parse(savedPrediction));
    }
  }, []);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;

    setIsDownloading(true);
    toast.info("Generating PDF...");

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`NeuroScan-Report-${new Date().toISOString().split("T")[0]}.pdf`);
      
      toast.success("Report downloaded successfully!");
    } catch (error) {
      toast.error("Failed to generate PDF");
      console.error(error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!prediction) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-12 text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Analysis Available</h2>
          <p className="text-muted-foreground mb-6">
            Please upload an MRI scan first to generate a report.
          </p>
          <Button onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go to Upload
          </Button>
        </Card>
      </div>
    );
  }

  const severityColor = classInfo[prediction.predictedClass]?.severity === "high" 
    ? "text-destructive" 
    : classInfo[prediction.predictedClass]?.severity === "medium"
    ? "text-yellow-600"
    : "text-secondary";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">NeuroScan AI</h1>
                <p className="text-xs text-muted-foreground">Medical Analysis Report</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                New Analysis
              </Button>
              <Button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="bg-gradient-to-r from-primary to-primary-dark"
              >
                <Download className="mr-2 h-4 w-4" />
                {isDownloading ? "Generating..." : "Download Report"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Report Content */}
      <main className="container mx-auto px-4 py-8">
        <div ref={reportRef} className="max-w-5xl mx-auto bg-white rounded-xl shadow-2xl p-12 animate-fade-in">
          {/* Report Header */}
          <div className="border-b-2 border-primary pb-6 mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Neurological Assessment Report
                </h1>
                <p className="text-muted-foreground">
                  Generated on {new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
                  <Brain className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-primary">AI Analysis</span>
                </div>
              </div>
            </div>
          </div>

          {/* MRI Image Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Input MRI Scan
            </h2>
            <div className="bg-slate-50 rounded-lg p-6 flex justify-center">
              <img
                src={prediction.imageUrl}
                alt="MRI Scan"
                className="max-h-80 rounded-lg shadow-md border-2 border-border"
              />
            </div>
          </div>

          {/* Prediction Results */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Diagnosis Results
            </h2>
            <Card className="p-6 bg-gradient-to-br from-accent/30 to-accent/10 border-2">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Predicted Condition</p>
                  <p className={`text-2xl font-bold ${severityColor}`}>
                    {classInfo[prediction.predictedClass]?.name || prediction.predictedClass}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Confidence Level</p>
                  <div className="flex items-center gap-3">
                    <Progress value={prediction.confidence} className="flex-1" />
                    <span className="text-2xl font-bold text-primary">
                      {prediction.confidence.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Clinical Interpretation</h2>
            <Card className="p-6 bg-slate-50">
              <p className="text-foreground leading-relaxed">{prediction.description}</p>
            </Card>
          </div>

          {/* Probability Distribution */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Detailed Probability Analysis</h2>
            <Card className="p-6">
              <div className="space-y-4">
                {Object.entries(prediction.probabilities)
                  .sort(([, a], [, b]) => b - a)
                  .map(([className, probability]) => (
                    <div key={className}>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-foreground">
                          {classInfo[className]?.name || className}
                        </span>
                        <span className="text-sm font-semibold text-primary">
                          {probability.toFixed(2)}%
                        </span>
                      </div>
                      <Progress value={probability} className="h-2" />
                    </div>
                  ))}
              </div>
            </Card>
          </div>

          {/* Recommendations */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Medical Recommendations</h2>
            <Card className="p-6 bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20">
              <ul className="space-y-3">
                {prediction.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{rec}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Disclaimer */}
          <div className="border-t pt-6 mt-8">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Disclaimer:</strong> This report is generated by an AI
              system and is intended for informational purposes only. It should not be used as a substitute
              for professional medical advice, diagnosis, or treatment. Always seek the advice of your
              physician or other qualified health provider with any questions you may have regarding a
              medical condition.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportPage;
