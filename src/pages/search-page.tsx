import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search as SearchIcon,
  MapPin,
  Clock,
  Filter,
  ChevronDown,
  CircleDollarSign,
  Briefcase,
} from "lucide-react";
import { Link } from "react-router-dom";
import { calculatePostingMatch, getLatestSearchCvAnalysis, getSearchActivePostings, PostingMatchResult, SearchPosting } from "@/lib/search-service";

type SearchPostingWithScore = SearchPosting & PostingMatchResult;

export const SearchPage = () => {
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("All");
  const [loading, setLoading] = useState(true);
  const [postings, setPostings] = useState<SearchPosting[]>([]);
  const [analysis, setAnalysis] = useState<Awaited<ReturnType<typeof getLatestSearchCvAnalysis>>>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [activePostings, latestAnalysis] = await Promise.all([
        getSearchActivePostings(),
        getLatestSearchCvAnalysis(),
      ]);
      setPostings(activePostings);
      setAnalysis(latestAnalysis);
      setLoading(false);
    };

    load();
  }, []);

  const industries = useMemo(() => {
    const unique = Array.from(new Set(postings.map((posting) => posting.industry).filter(Boolean)));
    return ["All", ...unique] as string[];
  }, [postings]);

  const filteredPostings = useMemo(() => {
    const q = search.toLowerCase().trim();

    const scored = postings.map((posting) => ({
      ...posting,
      ...calculatePostingMatch(posting, analysis),
    }));

    const searched = scored.filter((posting) => {
      const searchHaystack = [
        posting.title,
        posting.company_name,
        posting.description,
        posting.industry,
        ...(posting.required_skills ?? []),
        ...(posting.desired_skills ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !q || searchHaystack.includes(q);
      const matchesIndustry = industry === "All" || posting.industry === industry;
      return matchesSearch && matchesIndustry;
    });

    if (!analysis) {
      return searched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return searched.sort((a, b) => b.score - a.score);
  }, [analysis, industry, postings, search]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <Badge variant="indigo" className="mb-4">Live Postings</Badge>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">Explore Roles</h1>
          <p className="text-slate-500 font-medium mt-2">Discover opportunities through deep vector matching.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" className="rounded-full">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <div className="relative">
            <select
              className="h-11 border border-slate-200 rounded-full px-6 text-xs font-black uppercase tracking-widest bg-white appearance-none pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            >
              {industries.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="relative px-2">
        <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input
          className="pl-14 h-16 text-lg shadow-sm rounded-[1.5rem] border-slate-200 focus:ring-indigo-500 bg-white"
          placeholder="Search for roles, companies or skills..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed">
          <p className="text-slate-600 font-semibold">Loading opportunities...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPostings.map((posting) => (
              <PostingCard key={posting.posting_id} posting={posting} />
            ))}
          </div>

          {filteredPostings.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed">
              <div className="flex justify-center mb-4 text-slate-200">
                <Briefcase className="w-16 h-16" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No active postings found.</h3>
              <p className="text-slate-500">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const PostingCard = ({ posting }: { posting: SearchPostingWithScore; key?: string }) => {
  const companyName = posting.company_name || "Unknown Company";
  const logoUrl = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(companyName)}`;

  return (
    <Card className="flex flex-col hover:translate-y-[-4px] transition-all group overflow-hidden p-0 border-none shadow-sm hover:shadow-xl hover:shadow-indigo-50/50">
      <div className="p-8 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl border border-slate-100 flex items-center justify-center p-3 shadow-inner">
            <img referrerPolicy="no-referrer" src={logoUrl} alt="logo" className="w-full h-full object-contain" />
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Match</p>
            <p className="text-2xl font-black text-emerald-500 tracking-tighter">{posting.score}%</p>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <h3 className="font-black text-xl text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors leading-tight">
            {posting.title}
          </h3>
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.1em]">{companyName}</p>
          <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2" title={posting.matchReason}>
            {posting.matchReason}
          </p>

          <div className="flex flex-wrap gap-2 pt-4">
            <div className="flex items-center text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full uppercase tracking-widest">
              {posting.domainMatch} domain
            </div>
            <div className="flex items-center text-[10px] font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full uppercase tracking-wider">
              <MapPin className="w-3 h-3 mr-1.5" />
              {posting.location}
            </div>
            <div className="flex items-center text-[10px] font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full uppercase tracking-wider">
              <Clock className="w-3 h-3 mr-1.5" />
              {posting.duration_weeks ?? 12}w
            </div>
            {posting.is_paid && (
              <div className="flex items-center text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full uppercase tracking-widest">
                <CircleDollarSign className="w-3 h-3 mr-1.5" />
                Paid
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          {new Date(posting.deadline).toLocaleDateString("tr-TR")}
        </p>
        <Link to={`/postings/${posting.posting_id}`}>
          <Button size="sm" variant="ghost" className="rounded-full">Details</Button>
        </Link>
      </div>
    </Card>
  );
};
