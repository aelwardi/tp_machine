import PokemonList from "../components/PokemonList";

type PokemonType = { id: number; name: string; image: string };

async function fetchTypes(): Promise<PokemonType[]> {
    try {
        const res = await fetch("https://nestjs-pokedex-api.vercel.app/types", {
            cache: "force-cache",
        });
        if (!res.ok) return [];
        return res.json();
    } catch {
        return [];
    }
}

export default async function PokemonsPage() {
    const types = await fetchTypes();
    return <PokemonList types={types} />;
}