import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ScreenLayout from "@/components/ScreenLayout";

const Privacidade = () => {
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
        <h1 className="text-foreground text-lg font-bold">Política de Privacidade</h1>
      </header>

      <main className="flex-1 w-full px-6 overflow-y-auto no-scrollbar pb-12">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-muted-foreground text-xs mb-4">Última atualização: 31 de março de 2026</p>

          <h2 className="text-foreground text-base font-bold mt-6 mb-2">1. Dados Coletados</h2>
          <p className="text-foreground/80 text-sm leading-relaxed">
            Coletamos: dados de cadastro (nome, e-mail, senha criptografada); dados de perfil (foto, bio, localização); dados de uso (itens cadastrados, trocas, avaliações); dados técnicos (IP, dispositivo, navegador).
          </p>

          <h2 className="text-foreground text-base font-bold mt-6 mb-2">2. Finalidade do Tratamento</h2>
          <p className="text-foreground/80 text-sm leading-relaxed">
            Seus dados são utilizados para: operar e melhorar a plataforma; facilitar trocas entre usuários; personalizar sua experiência; enviar notificações relevantes; garantir a segurança da plataforma; cumprir obrigações legais.
          </p>

          <h2 className="text-foreground text-base font-bold mt-6 mb-2">3. Base Legal (LGPD)</h2>
          <p className="text-foreground/80 text-sm leading-relaxed">
            Tratamos seus dados com base em: consentimento (Art. 7º, I); execução de contrato (Art. 7º, V); legítimo interesse (Art. 7º, IX); cumprimento de obrigação legal (Art. 7º, II). Conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).
          </p>

          <h2 className="text-foreground text-base font-bold mt-6 mb-2">4. Compartilhamento de Dados</h2>
          <p className="text-foreground/80 text-sm leading-relaxed">
            Compartilhamos dados limitados com: outros usuários (nome, foto, localização — visíveis no perfil público); prestadores de serviços (infraestrutura, armazenamento); autoridades (quando exigido por lei). Não vendemos seus dados para terceiros.
          </p>

          <h2 className="text-foreground text-base font-bold mt-6 mb-2">5. Armazenamento e Segurança</h2>
          <p className="text-foreground/80 text-sm leading-relaxed">
            Seus dados são armazenados em servidores seguros com criptografia em trânsito (TLS) e em repouso. Senhas são armazenadas usando hash bcrypt. Realizamos backups regulares e monitoramento de segurança.
          </p>

          <h2 className="text-foreground text-base font-bold mt-6 mb-2">6. Seus Direitos</h2>
          <p className="text-foreground/80 text-sm leading-relaxed">
            Conforme a LGPD, você tem direito a: confirmar o tratamento de seus dados; acessar seus dados; corrigir dados incompletos ou desatualizados; solicitar anonimização ou exclusão; revogar consentimento; solicitar portabilidade. Para exercer seus direitos, entre em contato pelo e-mail: privacidade@hypou.app
          </p>

          <h2 className="text-foreground text-base font-bold mt-6 mb-2">7. Retenção de Dados</h2>
          <p className="text-foreground/80 text-sm leading-relaxed">
            Mantemos seus dados enquanto sua conta estiver ativa. Ao excluir sua conta, seus dados são permanentemente removidos em até 30 dias. Alguns dados podem ser retidos por obrigação legal.
          </p>

          <h2 className="text-foreground text-base font-bold mt-6 mb-2">8. Cookies</h2>
          <p className="text-foreground/80 text-sm leading-relaxed">
            Utilizamos cookies e armazenamento local para manter sua sessão ativa e preferências (como tema claro/escuro). Não utilizamos cookies de rastreamento de terceiros.
          </p>

          <h2 className="text-foreground text-base font-bold mt-6 mb-2">9. Menores de Idade</h2>
          <p className="text-foreground/80 text-sm leading-relaxed">
            O Hypou é destinado a maiores de 18 anos. Não coletamos intencionalmente dados de menores. Se identificarmos uma conta de menor, ela será encerrada.
          </p>

          <h2 className="text-foreground text-base font-bold mt-6 mb-2">10. Contato do Encarregado (DPO)</h2>
          <p className="text-foreground/80 text-sm leading-relaxed">
            Para questões relacionadas à proteção de dados, entre em contato com nosso Encarregado de Proteção de Dados pelo e-mail: dpo@hypou.app
          </p>
        </div>
      </main>
    </ScreenLayout>
  );
};

export default Privacidade;
