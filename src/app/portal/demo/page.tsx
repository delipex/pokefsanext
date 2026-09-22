import { getAllDecks, getNextEvent } from "@/lib/queries";
import { PlayerPortalDashboard } from "@/components/portal/PlayerPortalDashboard";

export const dynamic = "force-dynamic";

export default async function PlayerPortalDemoPage() {
  const [allDecks, nextEvent] = await Promise.all([
    getAllDecks(),
    getNextEvent(),
  ]);

  // Jogador Demo para visualização instantânea
  const demoPlayer = {
    id: "5685779",
    nome: "Adriel Nunes",
    categoria: "Master",
    cidade: "Feira de Santana - BA",
    deckAtivoNome: "Dragapult Ex",
    decklistTexto: `Pokémon: 14
4 Dragapult Ex TWM 130
3 Drakloak TWM 129
4 Dreepy TWM 128
1 Rotom V CRZ 45
1 Lumineon V BRS 40
1 Radiant Alakazam SIT 59

Treinador: 34
4 Arven OBF 186
3 Iono PAL 185
2 Boss's Orders PAL 172
4 Buddy-Buddy Poffin TEF 144
4 Ultra Ball PAF 91
2 Rare Candy PAF 89
2 Super Rod PAL 188
2 Counter Catcher PAR 160
1 Prime Catcher TEF 157
1 Technical Machine: Evolution PAR 178
1 Forest Seal Stone SIT 156
4 Nest Ball PAF 84
3 Technical Machine: Devolution PAR 177
3 Professor's Research PAF 87

Energia: 12
6 Fire Energy SVE 2
6 Psychic Energy SVE 5`,
  };

  const demoRankingItem = {
    pontos: 84.5,
    vitorias: 14,
    derrotas: 4,
    empates: 1,
    podios: 3,
  };

  const demoStageResults = [
    {
      etapaData: "2026-03-15",
      colocacao: 1,
      vitorias: 4,
      derrotas: 0,
      empates: 1,
      pontos: 25.0,
      deckNome: "Dragapult Ex",
    },
    {
      etapaData: "2026-03-01",
      colocacao: 2,
      vitorias: 4,
      derrotas: 1,
      empates: 0,
      pontos: 18.0,
      deckNome: "Dragapult Ex",
    },
    {
      etapaData: "2026-02-15",
      colocacao: 3,
      vitorias: 3,
      derrotas: 1,
      empates: 0,
      pontos: 15.0,
      deckNome: "Charizard Ex",
    },
  ];

  return (
    <PlayerPortalDashboard
      player={demoPlayer}
      rankingItem={demoRankingItem}
      stageResults={demoStageResults}
      allDecks={allDecks}
      nextEvent={nextEvent}
      submittedDecklist={null}
    />
  );
}
