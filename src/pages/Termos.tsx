import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ScreenLayout from "@/components/ScreenLayout";

const Termos = () => {
  const navigate = useNavigate();

  return (
    <ScreenLayout>
      <header className="relative z-40 flex items-center gap-3 px-6 pt-12 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="h-10 w-10 rounded-full flex items-center justify-center bg-card border border-foreground/10 text-foreground/60 hover:text-foreground transition-all shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-foreground text-lg font-bold">Termos de Uso</h1>
      </header>

      <main className="flex-1 w-full px-6 overflow-y-auto no-scrollbar pb-12">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-muted-foreground text-xs mb-4">Última atualização: 31 de março de 2026</p>

          <h2 className="text-foreground text-base font-bold mt-6 mb-2">1. Aceitação dos Termos</h2>
          <p className="text-foreground/80 text-sm leading-relaxed">
            Ao criar uma conta no Hypou, você concorda com estes Termos de Uso. Se não concordar, não utilize a plataforma.
          </p>

          <h2 className="text-foreground text-base font-bold mt-6 mb-2">2. Descrição do Serviço</h2>
          <p className="text-foreground/80 text-sm leading-relaxed">
            O Hypou é uma plataforma de trocas de bens entre usuários. Facilitamos a conexão entre pessoas que desejam trocar itens, mas não somos parte da transação. As trocas são realizadas diretamente entre os usuários.
          </p>

          <h2 className="text-foreground text-base font-bold mt-6 mb-2">3. Cadastro e Conta</h2>
          <p className="text-foreground/80 text-sm leading-relaxed">
            Para utilizar o Hypou, você deve: ter pelo menos 18 anos; fornecer informações verdadeiras e atualizadas; manter a segurança da sua senha; ser responsável por todas as atividades realizadas em sua conta.
          </p>

          <h2 className="text-foreground text-base font-bold mt-6 mb-2">4. Regras de Uso</h2>
          <p className="text-foreground/80 text-sm leading-relaxed">
            É proibido: publicar itens ilegais, falsificados ou roubados; utilizar linguagem ofensiva ou discriminatória; criar múltiplas contas; manipular preços ou avaliações; enviar spam ou conteúdo não solicitado.
          </p>

          <h2 className="text-foreground text-base font-bold mt-6 mb-2">5. Itens e Trocas</h2>
          <p className="text-foreground/80 text-sm leading-relaxed">
            Os usuários são responsáveis pela veracidade das informações dos itens cadastrados, incluindo fotos, descrição, condição e valor de mercado. O Hypou não garante a qualidade, segurança ou legalidade dos itens.
          </p>

          <h2 className="text-foreground text-base font-bold mt-6 mb-2">6. Propriedade Intelectual</h2>
          <p className="text-foreground/80 text-sm leading-relaxed">
            Todo o conteúdo da plataforma (design, marca, código) é propriedade do Hypou. Ao publicar conteúdo (fotos, vídeos), você nos concede licença não exclusiva para exibi-lo na plataforma.
          </p>

          <h2 className="text-foreground text-base font-bold mt-6 mb-2">7. Limitação de Responsabilidade</h2>
          <p className="text-foreground/80 text-sm leading-relaxed">
            O Hypou não se responsabiliza por: danos decorrentes de trocas entre usuários; itens defeituosos, falsificados ou diferentes do anunciado; perda de dados por caso fortuito ou força maior.
          </p>

          <h2 className="text-foreground text-base font-bold mt-6 mb-2">8. Exclusão de Conta</h2>
          <p className="text-foreground/80 text-sm leading-relaxed">
            Você pode excluir sua conta a qualquer momento nas configurações. Ao excluir, todos os seus dados serão permanentemente removidos. O Hypou pode suspender ou encerrar contas que violem estes termos.
          </p>

          <h2 className="text-foreground text-base font-bold mt-6 mb-2">9. Alterações nos Termos</h2>
          <p className="text-foreground/80 text-sm leading-relaxed">
            Podemos atualizar estes termos periodicamente. Notificaremos sobre mudanças significativas. O uso continuado após alterações implica aceitação dos novos termos.
          </p>

          <h2 className="text-foreground text-base font-bold mt-6 mb-2">10. Contato</h2>
          <p className="text-foreground/80 text-sm leading-relaxed">
            Dúvidas sobre estes termos? Entre em contato pelo e-mail: contato@hypou.app
          </p>
        </div>
      </main>
    </ScreenLayout>
  );
};

export default Termos;
