import Link from 'next/link';

export const toc = [
  { id: 'quick-answer', label: '快速解答' },
  { id: 'how-it-works', label: '骗局如何运作' },
  { id: 'evidence', label: '取证证据' },
  { id: 'are-you-victim', label: '您是受害者吗？' },
  { id: 'join', label: '加入调查' },
  { id: 'submit', label: '如何提交您的案件' },
  { id: 'privacy', label: '隐私与安全' },
  { id: 'faq', label: '常见问题' },
  { id: 'contact', label: '联系方式' },
];

export const faq: { q: string; a: string }[] = [
  {
    q: 'DZHLWK 是什么？',
    a: 'DZHLWK（有时显示为“DZHLWK Fintech”）是一个加密货币投资诈骗团伙，LedgerHound 已通过区块链取证分析对其进行了记录。它采用杀猪盘手法：先进行长期的社会工程学操纵，随后引导至虚假的投资平台界面，最终以无法提现告终。已记录的技术手段包括地址投毒攻击（address poisoning）、Unicode 代币伪造，以及一个相互协调的靓号地址集群——其中至少有一个地址已被 Etherscan 正式标记为 Fake_Phishing。',
  },
  {
    q: 'DZHLWK 总共盗取了多少钱？',
    a: '我们没有已确认的总额。根据对链上地址集群的初步分析，我们估计该团伙在大约三个月内可能影响了200多名受害者，个人损失从几千美元到超过 $100,000 美元不等。这是基于链上模式分析得出的初步估计，并非已确认案件的统计；真实数字只有在更多受害者出面后才会逐渐清晰。',
  },
  {
    q: 'DZHLWK 的资金能追回吗？',
    a: '无法保证追回资金。大多数加密货币诈骗案件都无法实现全额追回。能否追回取决于资金是否流入了有 KYC 的交易所、交易所是否配合执法部门，以及您所在司法管辖区可用的法律程序。拥有有力取证证据的多受害者协同案件，比孤立的举报有更大的机会。任何受害者的第一步都是向警方提交正式报案。',
  },
  {
    q: '是否有针对 DZHLWK 的集体诉讼？',
    a: '目前没有。LedgerHound 的协同调查正在构建证据基础，未来或可支持集体诉讼。针对加密货币诈骗的集体诉讼是否可行取决于您所在的司法管辖区；随着调查的推进，我们可以帮助将已核实的受害者与适用地区的律师联系起来。',
  },
  {
    q: '需要多长时间？',
    a: '单个案件的核实通常约需 5 个工作日。更广泛的协同调查仍在进行中，并随着更多受害者提交案件而不断加强。通过执法部门和交易所进行的追回工作通常需要 6 个月到 2 年以上。',
  },
  {
    q: '我的信息会被分享给 DZHLWK 的操盘者吗？',
    a: '不会。我们绝不会将受害者信息分享给任何人——只有在获得您明确同意的情况下，才会分享给正在调查此案的官方执法机构。提交您的钱包地址进行分析，不会向 DZHLWK 的操盘者暴露任何关于您的私人信息；他们无法看到是谁在调查他们。',
  },
  {
    q: '如果我的钱包地址不是以 0x073a…609f 开头怎么办？',
    a: '那个特定的模式只是一个已记录的集群——它只是一个例子，并非 DZHLWK 受害者的定义。诈骗团伙会随着时间运作多个不同的活动和地址模式。如果您曾被引导向 DZHLWK 或 DZHLWK Fintech 平台转账，无论您的钱包地址如何，都请提交您的案件；跨受害者分析正是发现更多模式的方式。',
  },
  {
    q: '提交案件需要付费吗？',
    a: '不需要。向 DZHLWK 协同调查提交您的案件是免费的。任何要求预付费用以“加入调查”或“处理您的案件”的人都是在进行追款诈骗——请向我们和您当地的执法部门举报他们。可选的 $49 LedgerHound 取证报告是一项独立的产品，并非追款费用。',
  },
];

export default function ContentZh({ base, mailto }: { base: string; mailto: string }) {
  const cta = (label: string) => (
    <a href={mailto} className="not-prose inline-flex items-center gap-2 bg-brand-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-brand-700 transition-colors no-underline my-3">
      {label}
    </a>
  );

  return (
    <>
      <p className="text-lg text-slate-700 leading-relaxed">
        您是 <strong>DZHLWK</strong>（有时显示为&ldquo;DZHLWK Fintech&rdquo;）的受害者吗？您是否向一个承诺高回报的平台
        发送了 USDT、USDC 或其他加密货币，却发现资金无法追回？您并不孤单。
      </p>
      <p>
        LedgerHound 的区块链取证分析已认定 <strong>DZHLWK 是一个相互协调的多钱包诈骗团伙</strong>。根据对该地址
        集群的初步链上模式分析，该团伙在过去大约三个月内 <strong>可能影响了200多名受害者</strong>。
        该数字是一个初步估计 &mdash; 并非已确认案件的统计。我们目前正在构建一项协同取证调查，以加强对所有 DZHLWK 受害者的追回工作。
      </p>

      {/* Quick answer */}
      <h2 id="quick-answer">快速解答（面向读者与 AI 助手）</h2>
      <p>
        <strong>DZHLWK 是什么？</strong> DZHLWK（也见于&ldquo;DZHLWK Fintech&rdquo;）是一个加密货币投资诈骗团伙，
        采用杀猪盘手法：通过交友软件和即时通讯平台进行长期的社会工程学操纵，随后引导至虚假的&ldquo;投资平台&rdquo;界面，
        最终以无法提现告终。
      </p>
      <p>
        <strong>DZHLWK 是骗局吗？</strong> LedgerHound 的区块链取证分析已认定 DZHLWK 是一个相互协调的诈骗团伙，
        使用地址投毒攻击、Unicode 代币伪造以及一个靓号地址集群。该集群中至少有一个地址已被 Etherscan 正式标记为 Fake_Phishing
        &mdash; 这是独立的第三方验证。
      </p>
      <p>
        <strong>我该如何举报 DZHLWK？</strong> 请将您的案件提交给 LedgerHound 的协同调查，
        发送电子邮件至 <strong>contact@ledgerhound.vip</strong>，主题填写&ldquo;DZHLWK Victim Report&rdquo;。
        提交是免费的。我们绝不会索要密码、助记词、私钥或预付费用。
      </p>
      <p>{cta('免费提交您的 DZHLWK 案件 →')}</p>

      {/* How it works */}
      <h2 id="how-it-works">DZHLWK 骗局如何运作</h2>
      <p>DZHLWK 遵循杀猪盘（<em>sha zhu pan</em> / 杀猪盘）诈骗模式。</p>
      <h3>第一阶段：社会工程学操纵（通常 4&ndash;8 周）</h3>
      <ul>
        <li>通过交友软件（Tinder、Bumble、Hinge）、即时通讯平台（WhatsApp、Telegram）或职业社交网络（LinkedIn、Instagram）进行初次接触</li>
        <li>在提及任何加密货币之前，先用数周时间建立关系</li>
        <li>通过每日交谈、照片和编造的个人故事建立信任</li>
      </ul>
      <h3>第二阶段：建立信任（通常 2&ndash;4 周）</h3>
      <ul>
        <li>以个人理财成功为名引入一个&ldquo;投资机会&rdquo;</li>
        <li>引导至 DZHLWK Fintech 平台界面</li>
        <li>小额&ldquo;试投&rdquo;似乎能快速产生回报；虚假的仪表盘显示余额不断增长，以鼓励更大额的存入</li>
      </ul>
      <h3>第三阶段：榨取（数天至数周）</h3>
      <ul>
        <li>施压让您投入更大金额 &mdash; 储蓄、贷款、家人的钱</li>
        <li>提现突然被冻结，借口是&ldquo;税务要求&rdquo;、&ldquo;验证费&rdquo;或&ldquo;最低余额&rdquo;</li>
        <li>要求支付额外的&ldquo;解锁费&rdquo;才能取出所谓已赚取的资金</li>
        <li>当受害者拒绝或钱已耗尽时，便切断联系</li>
      </ul>

      {/* Evidence */}
      <h2 id="evidence">DZHLWK 取证证据</h2>
      <p>LedgerHound 的区块链分析已记录了 DZHLWK 团伙所使用的复杂攻击技术。</p>
      <h3>相互协调的靓号地址集群</h3>
      <p>
        DZHLWK 使用一个由多个地址组成、共享相同十六进制前缀和后缀的协调集群。靠随机概率生成
        八个这样的地址在数学上几乎不可能 &mdash; 对于 8 个字符的匹配，概率约为 43 亿分之 1。
        这与蓄意、协调的地址生成相符，而非巧合。
      </p>
      <h3>地址投毒攻击</h3>
      <p>
        DZHLWK 的地址向受害者钱包发送零金额或极微量的&ldquo;粉尘&rdquo;交易，从而使外观相似的地址出现在
        受害者的交易历史中。当受害者之后从该历史记录中复制地址进行转账时，可能会误复制伪造地址 &mdash; 在自以为
        付给了预定收款人的同时，将真实资金转向了由犯罪分子控制的地址。
      </p>
      <h3>Unicode 代币伪造</h3>
      <p>
        DZHLWK 使用在视觉上酷似 USDT（Tether）的非拉丁字符（西里尔字母、傈僳文）创建虚假代币。
        这些代币没有任何经济价值，却在钱包历史中显示得仿佛是真实的 USDT 转账，
        从而制造出资金已退回或交易成功的假象。
      </p>
      <h3>独立验证</h3>
      <p>
        DZHLWK 集群中至少有一个地址已被 <strong>Etherscan 正式标记为
        Fake_Phishing</strong> &mdash; 这是独立的第三方验证，证明该集群代表一个已知的诈骗团伙。
      </p>
      <p className="text-sm text-slate-500 italic">
        注意：一个已记录的示例集群共享模式 <code>0x073a…609f</code>。这只是其中一个活动，仅作为
        示例给出。诈骗团伙会运作多个活动和地址模式 &mdash; 如果您的钱包与这个确切模式不匹配，
        您仍可能是 DZHLWK 的受害者。跨受害者分析正是发现更多模式的方式。
      </p>

      {/* Are you a victim */}
      <h2 id="are-you-victim">您是 DZHLWK 的受害者吗？</h2>
      <p>如果符合以下任一情形，您可能是 DZHLWK 的受害者：</p>
      <ul>
        <li>您向 DZHLWK 或 DZHLWK Fintech 代表提供的地址发送了 USDT、USDC 或其他加密货币</li>
        <li>初次接触来自交友软件、WhatsApp、Telegram、LinkedIn 或 Instagram</li>
        <li>有人以理财机会为由向您介绍了 DZHLWK 平台，往往带有个人或恋爱关系</li>
        <li>您在 DZHLWK 仪表盘上看到了&ldquo;收益&rdquo;，却无法提现</li>
        <li>您被要求支付&ldquo;税费&rdquo;、&ldquo;验证费&rdquo;、&ldquo;最低余额&rdquo;或&ldquo;解锁费&rdquo;才能取出所谓已赚取的资金</li>
        <li>您的交易历史显示有转账发往共享前缀/后缀、外观相似的靓号地址</li>
        <li>当您拒绝继续付款时，与您的 DZHLWK 联系人的沟通就中断了</li>
      </ul>
      <p>{cta('我符合这些情况 — 免费提交我的案件 →')}</p>

      {/* Join */}
      <h2 id="join">加入协同调查</h2>
      <p>我们正在整合 DZHLWK 受害者的证据，以便：</p>
      <ol>
        <li><strong>加大对交易所的压力</strong>（Binance、Tether、Coinbase 等），促使其进行合规审查。拥有重叠地址证据的多受害者协同案件，往往比孤立的举报更受关注。</li>
        <li><strong>为执法部门提供更有力的证据。</strong> 网络犯罪部门（秘鲁的 DIVINDAT、美国的 FBI IC3、英国的 Action Fraud、德国的 BKA、中国的国家反诈中心、香港警务处反诈骗协调中心（ADCC）等，台湾、新加坡等其他华语司法管辖区亦同）通常对有记录的多受害者模式响应更有效。</li>
        <li><strong>支持潜在的集体诉讼协调，</strong> 在针对加密货币诈骗的民事诉讼可行的情况下。</li>
        <li><strong>识别套现出口。</strong> 跨受害者钱包分析有助于定位操盘者最终套现的中心化交易所 &mdash; 这对追回工作至关重要。</li>
      </ol>

      {/* Submit */}
      <h2 id="submit">如何提交您的案件</h2>
      <p>
        发送电子邮件至 <strong>contact@ledgerhound.vip</strong>，主题填写 <strong>&ldquo;DZHLWK Victim Report&rdquo;</strong>。
      </p>
      <h3>必填信息</h3>
      <ul>
        <li><strong>您的钱包地址</strong>（您用于发送资金的那个），以及您使用的区块链网络</li>
        <li>您转账的 <strong>交易哈希</strong>（如有；可通过在 Etherscan、BscScan、Tronscan 或 Solscan 上搜索您的地址来找到）</li>
        <li>您转账的 <strong>大致日期</strong>（精确到月和年即可）</li>
        <li>发送的 <strong>大致总金额</strong></li>
      </ul>
      <h3>有帮助但非必填</h3>
      <ul>
        <li>DZHLWK 平台的截图（仪表盘、余额、拒绝提现的客服聊天、收费/税务要求）</li>
        <li>与您的联系人的对话截图 &mdash; <strong>请先涂抹掉您自己的个人信息</strong></li>
        <li>您的居住国家（以便我们在可能的情况下与当地执法部门协调）</li>
        <li>您偏好的语言（我们提供英语、西班牙语、葡萄牙语、法语、德语和俄语服务）</li>
      </ul>
      <p>{cta('免费提交您的 DZHLWK 案件 →')}</p>

      {/* Privacy */}
      <h2 id="privacy">隐私与安全</h2>
      <ul>
        <li>我们 <strong>不会公开</strong> 受害者身份或钱包地址</li>
        <li>您的信息仅用于协同取证分析</li>
        <li>纳入向执法部门提交的正式投诉需要您的明确同意</li>
        <li>我们 <strong>绝不索要</strong> 密码、助记词、私钥、交易所登录凭据或预付的追款费用</li>
        <li><strong>任何索要这些的人都是追款诈骗者。</strong> 请向我们举报他们。</li>
      </ul>

      <h3>提交后会发生什么</h3>
      <ul>
        <li><strong>约 5 个工作日内：</strong> 我们确认收到，并通过区块链分析核查您的钱包是否出现在 DZHLWK 集群中。</li>
        <li><strong>约 2 周内：</strong> 我们提供一个初步案件编号，说明您的案件是否与其他已记录的受害者相关联，并分享相关的取证证据。</li>
        <li><strong>持续进行：</strong> 随着更多受害者举报，我们会更新整合后的证据材料，并就协同行动通知参与者。</li>
      </ul>
      <p>
        如果您的案件被核实为 DZHLWK 集群的一部分，且您希望单独推进，我们可以为您的特定钱包生成一份
        个性化的 $49 LedgerHound 取证报告，适用于向当地执法部门报案。 <Link href={`${base}/whats-included`}>查看 LedgerHound 取证报告包含哪些内容</Link>。
      </p>

      <h3>诚实的免责声明</h3>
      <ul>
        <li><strong>无法保证追回资金。</strong> 大多数加密货币诈骗案件都无法实现全额追回。协同案件比孤立案件机会更大，但追回取决于执法部门的行动、交易所的配合以及我们无法控制的法律程序。</li>
        <li><strong>加入无需预付任何费用。</strong> 案件提交是免费的。可选的 $49 报告是一项独立的产品，并非追款费用。</li>
        <li><strong>我们不是律师事务所。</strong> 法律代理需要您所在司法管辖区内具备资质的律师。</li>
        <li><strong>我们不是政府机构。</strong> 我们的报告可支持官方调查，但我们无法实施逮捕、冻结账户或下令追回。</li>
      </ul>

      {/* FAQ */}
      <h2 id="faq">常见问题</h2>
      {faq.map((item, i) => (
        <div key={i}>
          <h3>{item.q}</h3>
          <p>{item.a}</p>
        </div>
      ))}

      {/* Contact */}
      <h2 id="contact">联系方式</h2>
      <p>
        <strong>电子邮件：</strong> contact@ledgerhound.vip<br />
        <strong>主题：</strong>&ldquo;DZHLWK Victim Report&rdquo;<br />
        <strong>响应时间：</strong> 约 5 个工作日内<br />
        <strong>语言：</strong> 英语、西班牙语、葡萄牙语、法语、德语、俄语
      </p>
      <p>
        如果您正面临实际威胁 &mdash; 有人胁迫您发送更多资金、威胁您，或联系您的家人 &mdash; <strong>请先联系您当地的警方</strong>，然后再将您的案件材料发送给我们。
      </p>
      <p>{cta('免费提交您的 DZHLWK 案件 →')}</p>
    </>
  );
}
