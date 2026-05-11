"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import PokemonModal from "./PokemonModal";

type PokemonType = { id: number; name: string; image: string };
type Pokemon = {
    id: number;
    pokedexId: number;
    name: string;
    image: string;
    types: PokemonType[];
};
type Filters = {
    name: string;
    types: number[];
    limit: number;
};

const BASE = "https://nestjs-pokedex-api.vercel.app";

export default function PokemonList({ types }: { types: PokemonType[] }) {
    const [pokemons, setPokemons] = useState<Pokemon[]>([]);
    const [filters, setFilters] = useState<Filters>({
        name: "",
        types: [],
        limit: 50,
    });
    const [inputName, setInputName] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [modalId, setModalId] = useState<number | null>(null);
    const [typeOpen, setTypeOpen] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const typeDropRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const t = setTimeout(() => {
            setLoading(true);
            setFilters((f) => ({ ...f, name: inputName }));
            setPage(1);
            setHasMore(true);
        }, 500);
        return () => clearTimeout(t);
    }, [inputName]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                typeDropRef.current &&
                !typeDropRef.current.contains(e.target as Node)
            ) {
                setTypeOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        let cancelled = false;

        const currentPage = page;
        const url = new URL(`${BASE}/pokemons`);
        url.searchParams.set("page", String(currentPage));
        url.searchParams.set("limit", String(filters.limit));
        if (filters.name.trim()) url.searchParams.set("name", filters.name.trim());
        filters.types.forEach((t) =>
            url.searchParams.append("types[]", String(t))
        );

        fetch(url.toString())
            .then((r) => r.json())
            .then((data) => {
                if (!cancelled) {
                    const list: Pokemon[] = Array.isArray(data) ? data : [];
                    if (list.length < filters.limit) setHasMore(false);
                    setPokemons((prev) => {
                        if (currentPage === 1) return list;
                        const seen = new Set(prev.map((p) => p.id));
                        return [...prev, ...list.filter((p) => !seen.has(p.id))];
                    });
                }
            })
            .catch(() => {
                if (!cancelled) setHasMore(false);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [filters, page]);

    useEffect(() => {
        if (!hasMore || loading) return;
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setLoading(true);
                    setPage((p) => p + 1);
                }
            },
            { threshold: 0 }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, loading]);

    const toggleType = (id: number) => {
        const newTypes = filters.types.includes(id)
            ? filters.types.filter((t) => t !== id)
            : [...filters.types, id];
        setLoading(true);
        setFilters((f) => ({ ...f, types: newTypes }));
        setPage(1);
        setHasMore(true);
    };

    const clearTypes = () => {
        setLoading(true);
        setFilters((f) => ({ ...f, types: [] }));
        setPage(1);
        setHasMore(true);
    };

    const resetFilters = () => {
        setLoading(true);
        setInputName("");
        setFilters({ name: "", types: [], limit: filters.limit });
        setPage(1);
        setHasMore(true);
    };

    const hasActiveFilters = filters.name.trim() !== "" || filters.types.length > 0;

    const handleLimit = (val: number) => {
        setLoading(true);
        setFilters((f) => ({ ...f, limit: val }));
        setPage(1);
        setHasMore(true);
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2.5 shrink-0">
                        <Image src="/logo.png" alt="Pokédex logo" width={28} height={28} className="object-contain" />
                        <span className="text-lg font-black tracking-tight text-gray-900">
              Poké<span className="text-red-500">dex</span>
            </span>
                    </div>

                    <div className="h-6 w-px bg-gray-200 shrink-0 hidden sm:block" />

                    <div className="relative">
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Rechercher un pokémon..."
                            value={inputName}
                            onChange={(e) => setInputName(e.target.value)}
                            className="w-56 pl-9 pr-8 py-2 text-sm text-gray-800 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400/40 focus:border-red-400 bg-gray-50 placeholder-gray-400 transition"
                        />
                        {inputName && (
                            <button
                                onClick={() => setInputName("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                                aria-label="Effacer"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                    <div className="relative" ref={typeDropRef}>
                        <button
                            onClick={() => setTypeOpen((o) => !o)}
                            className={`flex items-center justify-between gap-2 w-44 px-3 py-2 text-sm border rounded-xl transition-all bg-gray-50 ${
                                filters.types.length > 0
                                    ? "border-red-400 text-red-600 font-semibold bg-red-50"
                                    : "border-gray-200 text-gray-700 hover:bg-gray-100"
                            }`}
                        >
              <span className="truncate">
                {filters.types.length === 0
                    ? "Tous les types"
                    : filters.types.length === 1
                        ? types.find((t) => t.id === filters.types[0])?.name ?? "1 type"
                        : `${filters.types.length} types`}
              </span>
                            {filters.types.length > 0 ? (
                                <span className="ml-auto flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-red-500 text-white rounded-full shrink-0">
                  {filters.types.length}
                </span>
                            ) : (
                                <svg
                                    className={`w-3.5 h-3.5 shrink-0 transition-transform ${typeOpen ? "rotate-180" : ""}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            )}
                        </button>

                        {typeOpen && (
                            <div className="absolute left-0 top-full mt-1.5 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1 max-h-64 overflow-y-auto">
                                {filters.types.length > 0 && (
                                    <button
                                        onClick={clearTypes}
                                        className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 font-semibold border-b border-gray-100 transition"
                                    >
                                        Tout effacer
                                    </button>
                                )}
                                {types.map((type) => (
                                    <label
                                        key={type.id}
                                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 cursor-pointer transition"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={filters.types.includes(type.id)}
                                            onChange={() => toggleType(type.id)}
                                            className="w-3.5 h-3.5 accent-red-500 shrink-0"
                                        />
                                        <img src={type.image} alt={type.name} width={16} height={16} className="object-contain shrink-0" />
                                        <span className="text-sm text-gray-800">{type.name}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <select
                            value={filters.limit}
                            onChange={(e) => handleLimit(Number(e.target.value))}
                            className="appearance-none flex items-center gap-2 w-36 pl-3 pr-8 py-2 text-sm text-gray-700 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-400/40 focus:border-red-400 cursor-pointer transition hover:bg-gray-100"
                        >
                            {[10, 20, 50, 100].map((n) => (
                                <option key={n} value={n}>{n} / page</option>
                            ))}
                        </select>
                        <svg
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>

                    {hasActiveFilters && (
                        <button
                            onClick={resetFilters}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-red-500 border border-gray-200 hover:border-red-300 rounded-xl bg-gray-50 hover:bg-red-50 transition"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Réinitialiser
                        </button>
                    )}
                </div>

                {filters.types.length > 0 && (
                    <div className="max-w-7xl mx-auto px-6 pb-2.5 flex items-center gap-2 flex-wrap">
                        {filters.types.map((id) => {
                            const type = types.find((t) => t.id === id);
                            return type ? (
                                <button
                                    key={id}
                                    onClick={() => toggleType(id)}
                                    className="flex items-center gap-1.5 pl-2 pr-1.5 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded-full text-xs font-medium hover:bg-red-100 transition"
                                >
                                    <img src={type.image} alt={type.name} width={12} height={12} className="object-contain" />
                                    {type.name}
                                    <svg className="w-3 h-3 ml-0.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            ) : null;
                        })}
                    </div>
                )}
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
                {pokemons.length === 0 && !loading ? (
                    <div className="flex items-center justify-center py-24 text-gray-400 text-sm">
                        Aucun pokémon trouvé.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {pokemons.map((pokemon) => (
                            <button
                                key={`${pokemon.id}-${pokemon.pokedexId}`}
                                onClick={() => setModalId(pokemon.pokedexId)}
                                className="group bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all text-left cursor-pointer"
                            >
                                <div className="flex flex-col items-center gap-2">
                  <span className="self-start text-xs text-gray-400 font-mono">
                    #{String(pokemon.pokedexId).padStart(3, "0")}
                  </span>
                                    <div className="relative w-20 h-20">
                                        <Image
                                            src={pokemon.image}
                                            alt={pokemon.name}
                                            fill
                                            sizes="80px"
                                            className="object-contain group-hover:scale-110 transition-transform duration-200"
                                        />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-800 text-center leading-tight">
                    {pokemon.name}
                  </span>
                                    <div className="flex flex-wrap gap-1 justify-center">
                                        {pokemon.types.map((t) => (
                                            <span
                                                key={t.id}
                                                className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium"
                                            >
                        {t.name}
                      </span>
                                        ))}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {loading && (
                    <div className="flex justify-center py-10">
                        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {!hasMore && pokemons.length > 0 && !loading && (
                    <p className="text-center text-xs text-gray-400 py-6">
                        Tous les pokémons sont affichés.
                    </p>
                )}

                <div ref={sentinelRef} className="h-1" />
            </main>

            {modalId !== null && (
                <PokemonModal pokedexId={modalId} onClose={() => setModalId(null)} />
            )}
        </div>
    );
}