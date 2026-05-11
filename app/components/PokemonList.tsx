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
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [modalId, setModalId] = useState<number | null>(null);
    const [typeOpen, setTypeOpen] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const typeDropRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const t = setTimeout(() => {
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
        setLoading(true);

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
                    setPokemons((prev) =>
                        currentPage === 1 ? list : [...prev, ...list]
                    );
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
        setFilters((f) => ({ ...f, types: newTypes }));
        setPage(1);
        setHasMore(true);
    };

    const clearTypes = () => {
        setFilters((f) => ({ ...f, types: [] }));
        setPage(1);
        setHasMore(true);
    };

    const handleLimit = (val: number) => {
        setFilters((f) => ({ ...f, limit: val }));
        setPage(1);
        setHasMore(true);
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-6">
          <span className="text-lg font-bold text-red-600 shrink-0 tracking-tight">
            Pokédex
          </span>

                    <div className="flex items-end gap-3 flex-1 flex-wrap">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                                Recherche
                            </label>
                            <div className="relative">
                                <svg
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                                    />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Nom du pokémon..."
                                    value={inputName}
                                    onChange={(e) => setInputName(e.target.value)}
                                    className="w-56 pl-9 pr-3 py-2 text-sm text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 bg-white placeholder-gray-400"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1" ref={typeDropRef}>
                            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                                Type
                            </label>
                            <div className="relative">
                                <button
                                    onClick={() => setTypeOpen((o) => !o)}
                                    className={`flex items-center justify-between gap-2 w-44 px-3 py-2 text-sm border rounded-lg transition-colors bg-white ${
                                        filters.types.length > 0
                                            ? "border-red-400 text-red-600 font-medium"
                                            : "border-gray-300 text-gray-700"
                                    } hover:bg-gray-50`}
                                >
                  <span className="truncate">
                    {filters.types.length === 0
                        ? "Tous les types"
                        : filters.types.length === 1
                            ? types.find((t) => t.id === filters.types[0])?.name ?? "1 type"
                            : `${filters.types.length} types`}
                  </span>
                                    <svg
                                        className={`w-3.5 h-3.5 shrink-0 transition-transform ${typeOpen ? "rotate-180" : ""}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </button>

                                {typeOpen && (
                                    <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 max-h-64 overflow-y-auto">
                                        {filters.types.length > 0 && (
                                            <button
                                                onClick={clearTypes}
                                                className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-gray-50 font-semibold border-b border-gray-100"
                                            >
                                                Tout effacer
                                            </button>
                                        )}
                                        {types.map((type) => (
                                            <label
                                                key={type.id}
                                                className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={filters.types.includes(type.id)}
                                                    onChange={() => toggleType(type.id)}
                                                    className="w-3.5 h-3.5 accent-red-500 shrink-0"
                                                />
                                                <img
                                                    src={type.image}
                                                    alt={type.name}
                                                    width={16}
                                                    height={16}
                                                    className="object-contain shrink-0"
                                                />
                                                <span className="text-sm text-gray-800">{type.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                                Afficher
                            </label>
                            <select
                                value={filters.limit}
                                onChange={(e) => handleLimit(Number(e.target.value))}
                                className="w-28 px-3 py-2 text-sm text-gray-800 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer"
                            >
                                {[10, 20, 50, 100].map((n) => (
                                    <option key={n} value={n}>
                                        {n} / page
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
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