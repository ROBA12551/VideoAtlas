export default async () => {
  const adsTxt = `google.com, pub-XXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
indexexchange.com, XXXXXX, DIRECT
pubmatic.com, XXXXXX, DIRECT
rubiconproject.com, XXXXXX, DIRECT

# Fallback networks
spotxchange.com, XXXXXX, RESELLER
spotx.tv, XXXXXX, RESELLER`;

  return new Response(adsTxt, {
    headers: { 'Content-Type': 'text/plain' }
  });
};