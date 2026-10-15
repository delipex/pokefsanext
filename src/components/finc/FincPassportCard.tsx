"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { toPng, toBlob } from "html-to-image";
import {
  Download,
  Share2,
  Copy,
  Check,
  Printer,
  X,
  ExternalLink,
  Trophy,
  BookOpen,
  Calendar,
  GraduationCap,
  Globe,
  Building,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export interface FincInscricaoData {
  id?: number;
  protocolo: string;
  nome: string;
  whatsapp?: string;
  email?: string | null;
  tipoParticipante?: string;
  ra?: string | null;
  jogos?: any;
  torneioJogos?: string[];
  oficinaJogos?: string[];
  dias?: any;
  turnos?: string[];
  intencao?: string;
  possuiDeck?: string;
  observacoes?: string | null;
  status?: string;
  whatsappLink?: string;
}

interface FincPassportCardProps {
  inscricao: FincInscricaoData;
  onClose?: () => void;
  onNewRegistration?: () => void;
  isModal?: boolean;
}

const TCG_NAMES: Record<string, string> = {
  pokemon: "Pokémon TCG",
  yugioh: "Yu-Gi-Oh! TCG",
  onepiece: "One Piece Card Game",
  digimon: "Digimon Card Game",
  riftbound: "Riftbound TCG",
};

const TURNO_INFO: Record<string, { label: string; hora: string; turno: string }> = {
  "21_noite": { label: "21/10 (Quarta)", hora: "17h às 22h", turno: "Turno Noite" },
  "21": { label: "21/10 (Quarta)", hora: "17h às 22h", turno: "Turno Noite" },
  "22_tarde": { label: "22/10 (Quinta)", hora: "14h às 18h", turno: "Turno Tarde" },
  "22_noite": { label: "22/10 (Quinta)", hora: "18h às 20h", turno: "Turno Noite" },
  "22": { label: "22/10 (Quinta)", hora: "14h às 20h", turno: "Tarde & Noite" },
};

export function FincPassportCard({
  inscricao,
  onClose,
  onNewRegistration,
  isModal = false,
}: FincPassportCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);
  const [hasCopiedProtocol, setHasCopiedProtocol] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    text: string;
    type: "success" | "info" | "error";
  } | null>(null);

  // Parsear jogos (torneio, oficinas, geral)
  let torneioJogos: string[] = inscricao.torneioJogos || [];
  let oficinaJogos: string[] = inscricao.oficinaJogos || [];
  let listaGeral: string[] = [];

  if (torneioJogos.length === 0 && oficinaJogos.length === 0 && inscricao.jogos) {
    try {
      const parsed =
        typeof inscricao.jogos === "string" ? JSON.parse(inscricao.jogos) : inscricao.jogos;
      if (Array.isArray(parsed)) {
        listaGeral = parsed;
      } else if (parsed && typeof parsed === "object") {
        torneioJogos = parsed.torneio || [];
        oficinaJogos = parsed.oficinas || [];
        listaGeral = parsed.lista || [...torneioJogos, ...oficinaJogos];
      }
    } catch {
      listaGeral = [String(inscricao.jogos)];
    }
  }

  // Parsear turnos/dias
  let turnos: string[] = inscricao.turnos || [];
  if (turnos.length === 0 && inscricao.dias) {
    try {
      const parsed =
        typeof inscricao.dias === "string" ? JSON.parse(inscricao.dias) : inscricao.dias;
      turnos = Array.isArray(parsed) ? parsed : [String(inscricao.dias)];
    } catch {
      turnos = [String(inscricao.dias)];
    }
  }

  // Gerar QR Code localmente como data URL base64 para evitar taint no canvas
  useEffect(() => {
    let isMounted = true;
    const generateQr = async () => {
      try {
        const verifyUrl = `https://pokefsa.vercel.app/finc?protocolo=${encodeURIComponent(
          inscricao.protocolo
        )}`;
        const url = await QRCode.toDataURL(verifyUrl, {
          width: 280,
          margin: 1,
          color: {
            dark: "#050b18",
            light: "#ffffff",
          },
          errorCorrectionLevel: "M",
        });
        if (isMounted) {
          setQrCodeDataUrl(url);
        }
      } catch (err) {
        console.error("Erro ao gerar QR code:", err);
      }
    };

    if (inscricao.protocolo) {
      generateQr();
    }

    return () => {
      isMounted = false;
    };
  }, [inscricao.protocolo]);

  const showFeedback = (text: string, type: "success" | "info" | "error" = "success") => {
    setFeedbackMessage({ text, type });
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  // Copiar código do protocolo
  const handleCopyProtocol = () => {
    navigator.clipboard.writeText(inscricao.protocolo);
    setHasCopiedProtocol(true);
    showFeedback("Protocolo copiado para a área de transferência!", "success");
    setTimeout(() => setHasCopiedProtocol(false), 3000);
  };

  // Baixar imagem do crachá em formato PNG (alta qualidade)
  const handleDownloadPng = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: "#090d16",
        cacheBust: true,
      });

      const fileName = `passaporte-finc-${inscricao.protocolo.toLowerCase()}.png`;
      const link = document.createElement("a");
      link.download = fileName;
      link.href = dataUrl;
      link.click();

      showFeedback(
        "Imagem do passaporte baixada com sucesso! Você pode anexá-la na conversa do WhatsApp.",
        "success"
      );
    } catch (err: any) {
      console.error("Erro ao gerar PNG:", err);
      showFeedback("Não foi possível gerar a imagem automaticamente no navegador.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  // Compartilhar imagem direto no WhatsApp (Mobile) ou baixar + abrir WhatsApp (Desktop)
  const handleShareWhatsapp = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);

    try {
      const blob = await toBlob(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: "#090d16",
        cacheBust: true,
      });

      if (!blob) throw new Error("Falha ao renderizar imagem.");

      const fileName = `passaporte-finc-${inscricao.protocolo.toLowerCase()}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      // Se o navegador móvel suportar compartilhamento nativo de arquivo
      if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Passaporte Arena Geek TCG - FINC 2026",
          text: `Olá! Segue meu comprovante de inscrição da Arena Geek TCG (FINC 2026)!\nProtocolo: ${inscricao.protocolo}`,
        });
        showFeedback("Passaporte compartilhado com sucesso!", "success");
        return;
      }

      // Fallback para computadores ou navegadores que não suportam arquivo no share:
      // 1. Baixar o arquivo PNG
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = fileName;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

      // 2. Abrir WhatsApp com a mensagem pronta
      const zapText = encodeURIComponent(
        `Olá! Me inscrevi para o Espaço TCG na ARENA GEEK (FINC 2026).\n\n` +
          `🎫 *Protocolo:* ${inscricao.protocolo}\n` +
          `👤 *Nome:* ${inscricao.nome}\n` +
          (inscricao.ra ? `🎓 *RA:* ${inscricao.ra}\n` : "") +
          `Estou enviando a imagem do meu passaporte em anexo!`
      );

      const zapTargetUrl =
        inscricao.whatsappLink ||
        (inscricao.whatsapp
          ? `https://wa.me/55${inscricao.whatsapp.replace(/\D/g, "")}?text=${zapText}`
          : `https://wa.me/5575992683072?text=${zapText}`);

      window.open(zapTargetUrl, "_blank");
      showFeedback(
        "Imagem baixada! O WhatsApp foi aberto para você anexar a imagem baixada na conversa.",
        "info"
      );
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Erro no compartilhamento:", err);
        handleDownloadPng();
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 text-center animate-fadeIn">
      {/* MENSAGEM DE FEEDBACK TEMPORÁRIA */}
      {feedbackMessage && (
        <div
          className={`mx-auto max-w-md rounded-2xl p-3.5 text-xs font-semibold flex items-center gap-2.5 shadow-xl transition-all ${
            feedbackMessage.type === "success"
              ? "bg-emerald-950/90 border border-emerald-500/50 text-emerald-200"
              : feedbackMessage.type === "info"
              ? "bg-cyan-950/90 border border-cyan-500/50 text-cyan-200"
              : "bg-rose-950/90 border border-rose-500/50 text-rose-200"
          }`}
        >
          {feedbackMessage.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-cyan-400 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* O CRACHÁ VIP DIGITAL QUE SERÁ EXPORTADO COMO IMAGEM */}
      <div
        ref={cardRef}
        id="finc-passport-export-card"
        className="mx-auto max-w-md w-full rounded-3xl border-2 border-cyan-500/50 bg-[#090d16] p-6 text-left space-y-4 shadow-2xl relative overflow-hidden select-none"
      >
        {/* Furinho do cordão do crachá */}
        <div className="w-16 h-2 rounded-full bg-slate-950 border border-white/20 mx-auto -mt-2 mb-2 shadow-inner" />

        {/* Efeitos de iluminação de fundo */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-fuchsia-600/20 blur-3xl" />

        {/* Topo: Marcas Oficiais */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="relative h-6 w-auto">
              <Image
                src="/finc/finc-logo.png"
                alt="FINC 2026"
                width={80}
                height={26}
                className="h-full w-auto object-contain"
                unoptimized
              />
            </div>
            <span className="text-white/20">•</span>
            <div className="relative h-7 w-auto">
              <Image
                src="/finc/arena-geek-logo.png"
                alt="Arena Geek"
                width={100}
                height={36}
                className="h-full w-auto object-contain"
                unoptimized
              />
            </div>
          </div>
          <span className="text-[10px] uppercase font-black text-cyan-300 bg-cyan-500/15 border border-cyan-500/35 px-2.5 py-0.5 rounded-full tracking-wider">
            TCG VIP PASS
          </span>
        </div>

        {/* Tipo de Participante e RA */}
        <div className="flex flex-wrap items-center gap-2">
          {inscricao.tipoParticipante === "externo" ? (
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-950/70 border border-cyan-400/40 px-3 py-1.5 text-xs font-black text-cyan-200 uppercase tracking-wide">
              <Globe className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span>Participante Externo • Comunidade</span>
            </div>
          ) : inscricao.tipoParticipante === "unef" ? (
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-blue-950/70 border border-blue-400/40 px-3 py-1.5 text-xs font-black text-blue-200 uppercase tracking-wide">
              <GraduationCap className="h-3.5 w-3.5 text-blue-400 shrink-0" />
              <span>Aluno(a) UNEF</span>
            </div>
          ) : inscricao.tipoParticipante === "unifan" ? (
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-purple-950/70 border border-purple-400/40 px-3 py-1.5 text-xs font-black text-purple-200 uppercase tracking-wide">
              <GraduationCap className="h-3.5 w-3.5 text-purple-400 shrink-0" />
              <span>Aluno(a) UNIFAN</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 border border-white/20 px-3 py-1.5 text-xs font-black text-slate-200 uppercase tracking-wide">
              <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>Visitante Geral</span>
            </div>
          )}

          {inscricao.ra && (
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 px-3 py-1.5 text-xs font-mono font-bold text-cyan-300">
              <GraduationCap className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span>RA: {inscricao.ra}</span>
            </div>
          )}
        </div>

        {/* Nome do Participante */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
            Jogador Credenciado
          </span>
          <h3 className="text-xl font-black text-white uppercase tracking-tight">
            {inscricao.nome}
          </h3>
        </div>

        {/* QR Code + Protocolo */}
        <div className="rounded-2xl border border-white/10 bg-slate-950/90 p-3.5 flex flex-col sm:flex-row items-center gap-3.5">
          <div className="bg-white p-2 rounded-xl shadow-lg shrink-0">
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt={`QR Code ${inscricao.protocolo}`}
                className="w-24 h-24 object-contain"
              />
            ) : (
              <div className="w-24 h-24 flex items-center justify-center bg-slate-200 rounded-lg">
                <Loader2 className="h-6 w-6 animate-spin text-slate-600" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-1.5 text-center sm:text-left w-full">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Protocolo de Acesso
            </span>
            <div className="text-lg font-black font-mono text-cyan-300 tracking-wider">
              {inscricao.protocolo}
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Apresente este QR Code na entrada da Arena Geek no Cajueiro Convenções.
            </p>
          </div>
        </div>

        {/* Turnos Autorizados */}
        <div className="space-y-3 text-xs border-t border-white/10 pt-3">
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-black tracking-wider flex items-center gap-1">
              <Calendar className="h-3 w-3 text-cyan-400" />
              Turnos Confirmados:
            </span>
            <div className="flex flex-col gap-1 mt-1">
              {turnos.map((tid) => {
                const info = TURNO_INFO[tid] || {
                  label: tid,
                  hora: "Conforme programação",
                  turno: "Presença",
                };
                return (
                  <div
                    key={tid}
                    className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-slate-200"
                  >
                    <span className="font-bold text-white text-[11px]">{info.label}</span>
                    <span className="text-cyan-300 font-mono text-[11px]">
                      {info.hora} ({info.turno})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Torneios com Termo Homologado */}
          {torneioJogos.length > 0 && (
            <div className="space-y-1">
              <span className="text-amber-400 text-[10px] uppercase font-black tracking-wider flex items-center gap-1">
                <Trophy className="h-3 w-3 text-amber-400" />
                Torneios (Ordem de Preferência):
              </span>
              <div className="flex flex-col gap-1">
                {torneioJogos.map((j, idx) => (
                  <div
                    key={j}
                    className="flex items-center justify-between rounded-lg bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 text-xs"
                  >
                    <span className="font-bold text-amber-200">
                      {idx + 1}ª Opção: {TCG_NAMES[j] || j.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                      Deck Homologado ✅
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Oficinas Didáticas */}
          {oficinaJogos.length > 0 && (
            <div className="space-y-1">
              <span className="text-cyan-400 text-[10px] uppercase font-black tracking-wider flex items-center gap-1">
                <BookOpen className="h-3 w-3 text-cyan-400" />
                Oficinas (Ordem de Preferência):
              </span>
              <div className="flex flex-col gap-1">
                {oficinaJogos.map((j, idx) => (
                  <div
                    key={j}
                    className="flex items-center justify-between rounded-lg bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-1 text-xs"
                  >
                    <span className="font-bold text-cyan-200">
                      {idx + 1}ª Opção: {TCG_NAMES[j] || j.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-cyan-300 font-medium bg-cyan-950/60 border border-cyan-500/20 px-1.5 py-0.5 rounded">
                      Decks no Local
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Jogos gerais caso não haja torneio ou oficina separados */}
          {torneioJogos.length === 0 && oficinaJogos.length === 0 && listaGeral.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {listaGeral.map((g) => (
                <span
                  key={g}
                  className="px-2 py-0.5 rounded text-[10px] font-bold border border-white/10 bg-slate-800 text-slate-200 uppercase"
                >
                  {TCG_NAMES[g] || g}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé Oficial da Credencial */}
        <div className="border-t border-white/10 pt-2 text-[10px] text-slate-400 flex items-center justify-between">
          <span>Cajueiro Convenções • Feira de Santana - BA</span>
          <span className="text-cyan-400 font-bold">Gestão: Atlântica Mais</span>
        </div>
      </div>

      {/* BOTÕES DE AÇÃO: BAIXAR IMAGEM, ENVIAR WHATSAPP, COPIAR CÓDIGO */}
      <div className="mx-auto max-w-md flex flex-col gap-2.5 pt-1">
        {/* BOTÃO PRINCIPAL: BAIXAR IMAGEM PNG (PARA WHATSAPP) */}
        <button
          onClick={handleDownloadPng}
          disabled={isExporting}
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 px-6 py-3.5 text-xs sm:text-sm font-black text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Gerando Imagem PNG...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Baixar Imagem (Enviar no WhatsApp)</span>
            </>
          )}
        </button>

        {/* BOTÃO COMPARTILHAR DIRETAMENTE NO WHATSAPP */}
        <button
          onClick={handleShareWhatsapp}
          disabled={isExporting}
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/50 px-5 py-3 text-xs font-bold text-emerald-300 transition-all cursor-pointer disabled:opacity-50"
        >
          <Share2 className="h-4 w-4 text-emerald-400" />
          <span>Compartilhar Passaporte no WhatsApp</span>
        </button>

        {/* BOTÕES AUXILIARES: COPIAR CÓDIGO, IMPRIMIR E NOVA INSCRIÇÃO */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <button
            onClick={handleCopyProtocol}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-slate-800/80 hover:bg-slate-700/80 px-3.5 py-2.5 text-xs font-bold text-slate-300 transition-all cursor-pointer"
          >
            {hasCopiedProtocol ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copiar Código</span>
              </>
            )}
          </button>

          <button
            onClick={() => window.print()}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-slate-800/80 hover:bg-slate-700/80 px-3.5 py-2.5 text-xs font-bold text-slate-300 transition-all cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 text-cyan-400" />
            <span>Imprimir</span>
          </button>

          {onNewRegistration && (
            <button
              onClick={onNewRegistration}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-2.5 text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <span>Nova Inscrição</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2.5 text-xs font-bold text-rose-300 transition-all cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              <span>Fechar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
