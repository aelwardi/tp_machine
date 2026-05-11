"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type PokemonType = { id: number; name: string; image: string };
type Evolution = { name: string; pokedexId: number };
type Stats = {
    HP: number;
    speed: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
};
type PokemonDetail = {
    id: number;
    pokedexId: number;
    name: string;
    image: string;
    stats: Stats;
    generation: number;
    evolutions: Evolution[];
    types: PokemonType[];
};

const BASE = "https://nestjs-pokedex-api.vercel.app";

const STAT_LABELS: { key: keyof Stats; label: string }[] = [
    { key: "HP", label: "PV" },
    { key: "attack", label: "Attaque" },
    { key: "defense", label: "Défense" },
    { key: "specialAttack", label: "Attaque Sp." },
    { key: "specialDefense", label: "Défense Sp." },
    { key: "speed", label: "Vitesse" },
];

const STAT_MAX = 255;

interface PokemonModalProps {
    pokedexId: number;
    onClose: () => void;
}

export default function PokemonModal({ pokedexId, onClose }: PokemonModalProps) {
    const [pokemon, setPokemon] = useState<PokemonDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setPokemon(null);
        fetch(`${BASE}/pokemons/${pokedexId}`)
            .then((r) => r.json())
            .then((data) => {
                if (!cancelled) {
                    setPokemon(data);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [pokedexId]);

    useEffect(() => {
        document.body.style.overflow = "hidden";
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = "";
            document.removeEventListener("keydown", onKey);
        };
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 left-4 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                    Retour
                </button>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : !pokemon ? (
                    <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
                        Impossible de charger les données.
                    </div>
                ) : (
                    <div className="pt-16 pb-8 px-8">
                        <div className="flex flex-col items-center gap-2 mb-6">
              <span className="text-gray-400 text-sm font-mono">
                #{String(pokemon.pokedexId).padStart(3, "0")}
              </span>
                            <Image
                                src={pokemon.image}
                                alt={pokemon.name}
                                width={180}
                                height={180}
                                className="object-contain"
                                priority
                            />
                            <h2 className="text-2xl font-bold text-gray-900">
                                {pokemon.name}
                            </h2>
                            <div className="flex gap-2 flex-wrap justify-center">
                                {pokemon.types.map((t) => (
                                    <span
                                        key={t.id}
                                        className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700"
                                    >
                    {t.name}
                  </span>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                                Statistiques
                            </h3>
                            <div className="space-y-2.5">
                                {STAT_LABELS.map(({ key, label }) => {
                                    const value = pokemon.stats[key] ?? 0;
                                    const pct = Math.min(
                                        100,
                                        Math.round((value / STAT_MAX) * 100)
                                    );
                                    return (
                                        <div key={key} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-24 shrink-0">
                        {label}
                      </span>
                                            <span className="text-xs font-semibold text-gray-800 w-8 shrink-0 text-right">
                        {value}
                      </span>
                                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-red-500 rounded-full transition-all"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {pokemon.evolutions && pokemon.evolutions.length > 0 && (
                            <div>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                                    Évolutions
                                </h3>
                                <div className="flex flex-wrap gap-4">
                                    {pokemon.evolutions.map((evo) => (
                                        <div
                                            key={evo.pokedexId}
                                            className="flex flex-col items-center gap-1 bg-gray-50 rounded-xl p-3"
                                        >
                                            <Image
                                                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${evo.pokedexId}.png`}
                                                alt={evo.name}
                                                width={72}
                                                height={72}
                                                className="object-contain"
                                            />
                                            <span className="text-xs text-gray-700 font-medium">
                        {evo.name}
                      </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}