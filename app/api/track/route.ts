import { NextRequest, NextResponse } from 'next/server';

const ALCHEMY_URL = 'https://eth-mainnet.g.alchemy.com/v2/OAymykkPw_Oi3LINBgrqZ';

async function fetchTransfers(params: object) {
  const res = await fetch(ALCHEMY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 1,
      jsonrpc: '2.0',
      method: 'alchemy_getAssetTransfers',
      params: [params],
    }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result?.transfers || [];
}

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ error: 'Invalid Ethereum address' }, { status: 400 });
    }

    const baseParams = {
      fromBlock: '0x0',
      toBlock: 'latest',
      category: ['external', 'internal', 'erc20', 'erc721', 'erc1155'],
      withMetadata: true,
      maxCount: '0x3e8',
    };

    const [incoming, outgoing] = await Promise.all([
      fetchTransfers({ ...baseParams, toAddress: address }),
      fetchTransfers({ ...baseParams, fromAddress: address }),
    ]);

    const inTagged = incoming.map((tx: any) => ({ ...tx, direction: 'IN' }));
    const outTagged = outgoing.map((tx: any) => ({ ...tx, direction: 'OUT' }));

    const all = [...inTagged, ...outTagged].sort((a, b) => {
      const da = a.metadata?.blockTimestamp ? new Date(a.metadata.blockTimestamp).getTime() : 0;
      const db = b.metadata?.blockTimestamp ? new Date(b.metadata.blockTimestamp).getTime() : 0;
      return db - da;
    });

    let totalEthIn = 0;
    let totalEthOut = 0;
    for (const tx of all) {
      if (tx.asset === 'ETH' && tx.value) {
        if (tx.direction === 'IN') totalEthIn += tx.value;
        else totalEthOut += tx.value;
      }
    }

    return NextResponse.json({
      transfers: all,
      stats: {
        total: all.length,
        totalEthIn: Math.round(totalEthIn * 1e6) / 1e6,
        totalEthOut: Math.round(totalEthOut * 1e6) / 1e6,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch transfers' }, { status: 500 });
  }
}
