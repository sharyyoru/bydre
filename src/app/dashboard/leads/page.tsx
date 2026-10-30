"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Lead = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  country: string | null;
  interest: string | null;
  status: string | null;
  created_at: string;
};

export default function LandingLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const pageSize = 25;

  const refreshLeads = useCallback(() => setRefresh((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    const loadLeads = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `/api/public-leads?${new URLSearchParams({ page: String(page), search })}`,
          { cache: "no-store", signal: controller.signal },
        );
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.error || "Unable to load leads.");
        if (controller.signal.aborted) return;
        if (page > 1 && result.total <= (page - 1) * pageSize) {
          setPage(Math.max(1, Math.ceil(result.total / pageSize)));
          return;
        }
        setLeads(result.leads);
        setTotal(result.total);
      } catch (failure) {
        if (controller.signal.aborted) return;
        setLeads([]);
        setError(
          failure instanceof Error ? failure.message : "Unable to load leads.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    loadLeads();
    return () => controller.abort();
  }, [page, search, refresh]);

  useEffect(() => {
    const interval = window.setInterval(refreshLeads, 60000);
    return () => window.clearInterval(interval);
  }, [refreshLeads]);

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#0A1628] p-3 text-[#D4AF37]">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0A1628]">
                Landing Leads
              </h1>
              <p className="text-sm text-muted-foreground">
                Palm Springs registrations, saved directly to your database.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/landing" target="_blank" rel="noopener noreferrer">
                View landing page <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" onClick={refreshLeads} disabled={loading}>
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        <Card className="rounded-2xl border-border/60">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {search ? "Matching registrations" : "Total registrations"}
                </p>
                <p className="text-3xl font-bold text-[#0A1628]">
                  {loading || error ? "—" : total.toLocaleString()}
                </p>
              </div>
              <p className="max-w-sm text-sm text-muted-foreground">
                Newest first. Automatically refreshes every minute. Only
                signed-in workspace members can view this list.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border-border/60">
          <div className="border-b p-4">
            <form
              className="flex flex-wrap items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                setPage(1);
                setSearch(searchInput.trim());
                refreshLeads();
              }}
            >
              <label htmlFor="lead-name-search" className="sr-only">
                Search leads by name
              </label>
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="lead-name-search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  maxLength={100}
                  placeholder="Search by name"
                  className="pl-9"
                />
              </div>
              <Button type="submit" disabled={loading}>
                Search
              </Button>
              {search && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                    setPage(1);
                  }}
                >
                  Clear
                </Button>
              )}
            </form>
          </div>
          {error ? (
            <div className="space-y-3 p-8 text-center" role="alert">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" onClick={refreshLeads}>
                Try again
              </Button>
            </div>
          ) : loading ? (
            <div
              className="flex items-center justify-center gap-2 p-12 text-muted-foreground"
              role="status"
            >
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading leads…
            </div>
          ) : leads.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <h2 className="font-semibold">
                {search ? "No matching leads" : "No registrations yet"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {search
                  ? "Try a different name or clear the search."
                  : "New registrations from the Palm Springs landing page will appear here."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Interest</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">
                      {lead.full_name}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <a
                          href={`mailto:${lead.email}`}
                          className="inline-flex items-center gap-2 text-xs hover:underline"
                        >
                          <Mail className="h-3 w-3 shrink-0" />
                          {lead.email}
                        </a>
                        <a
                          href={`tel:${lead.phone.replace(/[^+\d]/g, "")}`}
                          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:underline"
                        >
                          <Phone className="h-3 w-3 shrink-0" />
                          {lead.phone}
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>{lead.country || "Not specified"}</TableCell>
                    <TableCell>{lead.interest || "Not specified"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          lead.status === "new" ? "default" : "secondary"
                        }
                      >
                        {lead.status || "new"}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {format(new Date(lead.created_at), "dd MMM yyyy, HH:mm")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!error && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4 text-sm text-muted-foreground">
              <span aria-live="polite">
                {loading
                  ? "Loading…"
                  : total === 0
                    ? "0 registrations"
                    : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}
              </span>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Previous page"
                  disabled={loading || page === 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span>
                  Page {page} of {pages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Next page"
                  disabled={loading || page >= pages}
                  onClick={() => setPage((value) => value + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
