"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SearchableSelect } from "@/components/helpers/searchableSelect";

type ConfidenceScores = {
  positive?: number;
  neutral?: number;
  negative?: number;
};

type Entity = {
  text: string;
  category: string;
  confidenceScore: number;
};

type AnalyzedReview = {
  id: string;
  reviewId: string;
  restaurantId: string;
  week: number;
  year: number;
  text: string;
  sentiment: "Positive" | "Neutral" | "Negative" | string;
  rating: number;
  reviewType: string;
  confidenceScores?: ConfidenceScores;
  keyPhrases?: string[];
  entities?: Entity[];
};

type AnalysisResponse = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  week: number;
  year: number;
  averageRating: number;
  totalReviews: number;
  analyzedReviewCount: number;
  overallSentiment: "Positive" | "Neutral" | "Negative" | string;
  analyzedReviews: AnalyzedReview[];
};

function SentimentBadge({ value }: { value: string }) {
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border";
  const v = (value || "").toLowerCase();

  if (v === "positive")
    return (
      <span className={`${base} border-green-300 bg-green-50 text-green-700`}>
        Positive
      </span>
    );
  if (v === "negative")
    return (
      <span className={`${base} border-red-300 bg-red-50 text-red-700`}>
        Negative
      </span>
    );
  if (v === "neutral")
    return (
      <span className={`${base} border-yellow-300 bg-yellow-50 text-yellow-800`}>
        Neutral
      </span>
    );

  return (
    <span className={`${base} border-slate-300 bg-slate-50 text-slate-700`}>
      {value}
    </span>
  );
}

function Stars({ rating }: { rating: number }) {
  const value = Math.max(0, Math.min(5, Number(rating) || 0));

  return (
    <div className="flex items-center gap-1 whitespace-nowrap">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < value;

        return (
          <Star
            key={i}
            size={16}
            color={filled ? "#facc15" : "#94a3b8"} // stroke
            fill={filled ? "#facc15" : "transparent"} // fill
          />
        );
      })}
      <span className="ml-2 text-xs text-muted-foreground">({value}/5)</span>
    </div>
  );
}

async function readErrorDetail(res: Response) {
  try {
    const data = await res.json();
    return data?.detail || data?.title || JSON.stringify(data);
  } catch {
    try {
      return await res.text();
    } catch {
      return `Request failed (${res.status})`;
    }
  }
}

export default function WeeklyCustomerSentiment() {
  const [serviceProviders, setServiceProviders] = useState<any[]>([]);
  const [serviceProviderId, setServiceProviderId] = useState<string | null>(null);

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [calendarMonth, setCalendarMonth] = useState<Date | undefined>(date);

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [noData, setNoData] = useState(false);

  const dateParam = useMemo(() => (date ? format(date, "yyyy-MM-dd") : ""), [date]);

  const fetchProviders = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/RestaurantManagement/getallrestaurants`
      );
      const result = await res.json();
      if (result) setServiceProviders(result);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load providers");
    }
  };

  useEffect(() => {
    if (serviceProviders.length === 0) fetchProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceProviders.length]);

  const sentimentCounts = useMemo(() => {
    const reviews = analysis?.analyzedReviews ?? [];
    return reviews.reduce(
      (acc, r) => {
        if (r.sentiment === "Positive") acc.Positive += 1;
        else if (r.sentiment === "Neutral") acc.Neutral += 1;
        else if (r.sentiment === "Negative") acc.Negative += 1;
        else acc.Other += 1;
        return acc;
      },
      { Positive: 0, Neutral: 0, Negative: 0, Other: 0 }
    );
  }, [analysis]);

  const fetchWeeklyAnalysis = async () => {
    if (!serviceProviderId || !dateParam) return;

    const base = process.env.NEXT_PUBLIC_API_URL;
    const url = `${base}/v2/analysis/${serviceProviderId}?date=${encodeURIComponent(
      dateParam
    )}`;

    try {
      setLoading(true);
      setAnalysis(null);
      setNoData(false);

      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (res.status === 404) {
        setNoData(true);
        return;
      }

      if (!res.ok) {
        const detail = await readErrorDetail(res);
        throw new Error(detail || `Request failed (${res.status})`);
      }

      const result = (await res.json()) as AnalysisResponse;
      setAnalysis(result);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load weekly analysis");
    } finally {
      setLoading(false);
    }
  };

  const downloadWeeklyPdf = async () => {
    if (!serviceProviderId || !dateParam) return;

    const base = process.env.NEXT_PUBLIC_API_URL;
    const url = `${base}/v2/analysis/${serviceProviderId}/pdf?date=${encodeURIComponent(
      dateParam
    )}`;

    try {
      setLoading(true);
      setNoData(false);

      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/pdf" }, // no Content-Type on GET
      });

      if (res.status === 404) {
        setNoData(true);
        toast.message("No data found for the selected provider and week.");
        return;
      }

      if (!res.ok) {
        const detail = await readErrorDetail(res);
        toast.error(detail || `Failed to download PDF (${res.status})`);
        return;
      }

      const blob = await res.blob();

      // Try infer filename from Content-Disposition
      const cd = res.headers.get("content-disposition") || "";
      const match = cd.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
      const inferredName = match?.[1] ? decodeURIComponent(match[1]) : null;

      const restaurantName =
        serviceProviders.find((s) => s.id === serviceProviderId)?.name ||
        "weekly_report";

      const filename = inferredName || `${restaurantName}_${dateParam}.pdf`;

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error(err);
      toast.error("Failed to download report PDF.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (date) setCalendarMonth(date);
  }, [date]);

  const inputsSelected = !!serviceProviderId && !!date && !loading;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Weekly Customer Sentiment</h1>

      <div className="flex justify-between items-center mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                onSelect={(d) => {
                  setDate(d);
                  if (d) setCalendarMonth(d);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button onClick={fetchWeeklyAnalysis} disabled={!inputsSelected}>
            {loading ? "Loading..." : "Search"}
          </Button>

          <Button variant="secondary" onClick={downloadWeeklyPdf} disabled={!inputsSelected}>
            Download PDF
          </Button>

          {dateParam && (
            <span className="text-sm text-muted-foreground">
              Query date: <span className="font-medium">{dateParam}</span>
            </span>
          )}
        </div>

        {serviceProviders.length > 0 && (
          <SearchableSelect
            options={serviceProviders.map((sp: any) => ({ id: sp.id, label: sp.name }))}
            value={serviceProviderId}
            onChange={(val) => setServiceProviderId(val)}
            allLabel="All providers"
            className="w-64"
          />
        )}
      </div>

      {noData && (
        <div className="rounded border border-dashed p-6 text-center text-muted-foreground">
          No data found for the selected provider and week.
        </div>
      )}

      {analysis?.analyzedReviews?.length > 0 && (
        <div className="mb-4 rounded border p-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-lg font-semibold">{analysis.restaurantName}</div>
              <div className="text-sm text-muted-foreground">
                Week {analysis.week}, {analysis.year}
              </div>
            </div>

            <div className="flex gap-6 flex-wrap">
              <div>
                <div className="text-xs text-muted-foreground">Overall Sentiment</div>
                <div className="mt-1">
                  <SentimentBadge value={analysis.overallSentiment} />
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground">Average Rating</div>
                <div className="mt-1 font-bold text-xl">{analysis.averageRating ?? "-"}</div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground">Total Reviews</div>
                <div className="mt-1 font-bold text-xl">{analysis.totalReviews ?? "-"}</div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground">Analyzed</div>
                <div className="mt-1 font-bold text-xl">{analysis.analyzedReviewCount ?? "-"}</div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground mr-2">Sentiment split:</span>
            <span className="rounded-full border px-2 py-0.5 text-xs">
              Positive: {sentimentCounts.Positive}
            </span>
            <span className="rounded-full border px-2 py-0.5 text-xs">
              Neutral: {sentimentCounts.Neutral}
            </span>
            <span className="rounded-full border px-2 py-0.5 text-xs">
              Negative: {sentimentCounts.Negative}
            </span>
            {sentimentCounts.Other > 0 && (
              <span className="rounded-full border px-2 py-0.5 text-xs">
                Other: {sentimentCounts.Other}
              </span>
            )}
          </div>
        </div>
      )}

      {analysis?.analyzedReviews?.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sentiment</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Review</TableHead>
              <TableHead>Key Phrases</TableHead>
              <TableHead>Entities</TableHead>
              <TableHead>Confidence</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {analysis.analyzedReviews.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <SentimentBadge value={r.sentiment} />
                </TableCell>

                <TableCell>
                  <Stars rating={r.rating} />
                </TableCell>

                <TableCell className="whitespace-nowrap">{r.reviewType}</TableCell>

                <TableCell className="max-w-[420px]">
                  <div className="text-sm">{r.text}</div>
                </TableCell>

                <TableCell className="max-w-[260px]">
                  {r.keyPhrases?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {r.keyPhrases.slice(0, 6).map((kp, idx) => (
                        <span key={idx} className="text-xs rounded-full border px-2 py-0.5">
                          {kp}
                        </span>
                      ))}
                      {r.keyPhrases.length > 6 && (
                        <span className="text-xs text-muted-foreground">
                          +{r.keyPhrases.length - 6} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>

                <TableCell className="max-w-[260px]">
                  {r.entities?.length ? (
                    <div className="flex flex-col gap-1">
                      {r.entities.slice(0, 3).map((e, idx) => (
                        <div key={idx} className="text-xs">
                          <span className="font-medium">{e.text}</span>{" "}
                          <span className="text-muted-foreground">
                            ({e.category}, {(e.confidenceScore ?? 0).toFixed(2)})
                          </span>
                        </div>
                      ))}
                      {r.entities.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{r.entities.length - 3} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>

                <TableCell className="whitespace-nowrap">
                  <div className="text-xs text-muted-foreground">
                    {r.confidenceScores?.positive !== undefined && (
                      <div>Pos: {r.confidenceScores.positive.toFixed(2)}</div>
                    )}
                    {r.confidenceScores?.neutral !== undefined && (
                      <div>Neu: {r.confidenceScores.neutral.toFixed(2)}</div>
                    )}
                    {r.confidenceScores?.negative !== undefined && (
                      <div>Neg: {r.confidenceScores.negative.toFixed(2)}</div>
                    )}
                    {!r.confidenceScores && <div>—</div>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : analysis ? (
        <div className="text-sm text-muted-foreground">
          No analyzed reviews returned for that week.
        </div>
      ) : null}
    </div>
  );
}
