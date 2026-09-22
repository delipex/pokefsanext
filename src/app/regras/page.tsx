import { BookOpen, ShieldCheck, Award, Trophy, Scale, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Regulamento Oficial | Liga Atlântica TCG",
  description: "Regras do circuito, formato dos torneios, sistema de pontuação e código de conduta.",
};

export default function RegrasPage() {
  const sections = [
    {
      icon: ShieldCheck,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      title: "1. Formato do Torneio",
      content: [
        "As partidas das Sessões de Liga seguem o Formato Standard oficial estabelecido pela The Pokémon Company International.",
        "Legalidade: São permitidas apenas cartas com as marcas de regulamento vigentes (ex: bloco H e posteriores).",
        "Listas de Deck: Os jogadores são responsáveis por manter seus decks dentro das diretrizes de legalidade vigentes em cada etapa.",
      ],
    },
    {
      icon: Trophy,
      color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
      title: "2. Sistema de Pontuação e Ranking",
      content: [
        "Vitória: 3 pontos | Empate: 1 ponto | Derrota: 0 pontos.",
        "Multiplicadores de Eventos Especiais: League Challenge e League Cup possuem multiplicador de 1.5x a 2.0x sobre a pontuação.",
        "Critérios de Desempate no Ranking: 1º Pontos Acumulados ➔ 2º Número de Pódios (Top 4) ➔ 3º Média de Colocação (menor é melhor) ➔ 4º Ordem Alfabética.",
      ],
    },
    {
      icon: Award,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      title: "3. Premiação e Playoffs Trimestrais",
      content: [
        "Ao final de cada temporada trimestral, os 4 melhores colocados avançam para os Playoffs (Top Cut).",
        "Formato do Top Cut: Rodada eliminatória presencial (Single Elimination).",
        "Premiação: Troféus personalizados, boosters exclusivos e premiações especiais para os campeões.",
      ],
    },
    {
      icon: Scale,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      title: "4. Código de Conduta e Fair Play",
      content: [
        "A integridade do jogo e o respeito mútuo são pilares fundamentais da nossa comunidade.",
        "Seguimos rigorosamente o manual de Play! Pokémon e as orientações da arbitragem oficial.",
        "Condutas antidesportivas, trapaças ou desrespeito a outros jogadores resultam em advertência ou desclassificação imediata da temporada.",
      ],
    },
  ];

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      <div className="text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          Regulamento da Liga Atlântica
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {sections.map((section, idx) => {
          const Icon = section.icon;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${section.color}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="text-lg font-black text-white">{section.title}</h3>
              </div>

              <div className="space-y-2.5 pl-2">
                {section.content.map((p, pIdx) => (
                  <div key={pIdx} className="flex items-start gap-2.5 text-sm text-slate-300 leading-relaxed">
                    <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
