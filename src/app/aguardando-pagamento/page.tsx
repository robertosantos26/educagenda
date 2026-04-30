export default function AguardandoPagamento() {
  return (
    <div style={container}>
      <div style={card}>
        <h1>⏳ Aguardando pagamento</h1>

        <p>
          Seu acesso ao sistema será liberado assim que o pagamento for confirmado.
        </p>

        <p>
          Caso já tenha realizado o pagamento, aguarde alguns minutos ou entre em contato.
        </p>

        <strong>Educagenda</strong>
      </div>
    </div>
  );
}

const container = {
  height: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f3f4f6",
};

const card = {
  background: "white",
  padding: 30,
  borderRadius: 16,
  textAlign: "center" as const,
  maxWidth: 400,
};
