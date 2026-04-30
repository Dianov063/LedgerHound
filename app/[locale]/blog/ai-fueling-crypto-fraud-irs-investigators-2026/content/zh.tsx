import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ContentZh({ base }: { base: string }) {
  return (
    <>
      <p className="text-lg text-slate-700 leading-relaxed">Kyle Holder以为她正在和一个名叫Niamh的真实人物交谈。两个月的对话。一个虚假的“客服团队”指导她关于钱包和转账。当她意识到时，她的积蓄已经没了——通过层层区块链交易被抽走。这不是一个孤立的故事。这是加密货币欺诈的新面貌，而且由人工智能驱动。</p>
      <p className="text-lg text-slate-700 leading-relaxed">数字令人震惊。根据<a href="https://gizmodo.com/crypto-investment-scams-were-the-most-costly-type-of-fraud-in-the-u-s-in-2025-2000743099" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">FBI的2025年IC3报告</a>，美国人在2025年因加密货币投资骗局损失了72亿美元——使其成为向该机构报告的最昂贵的欺诈类型。IRS调查人员表示AI是关键驱动因素。在一篇<a href="https://www.cbsnews.com/news/ai-crypto-fraud-irs-investigators/" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">CBS新闻报道</a>中，官员们透露了深度伪造语音、AI生成的个人资料和自动聊天脚本如何使骗局比以往任何时候都更具说服力。</p>
      <p className="text-lg text-slate-700 leading-relaxed">本文分解了AI如何增强加密货币欺诈，IRS调查人员在实地看到了什么，以及——最重要的是——如何使用区块链取证和免费工具如<Link href={`${base}/wallet-tracker`} className="text-brand-600 hover:underline">LedgerHound的钱包追踪器</Link>进行反击。</p>

      <h2 id="the-ai-powered-scam-machine">AI驱动的骗局机器</h2>

      <p>骗子一直擅长操纵。但AI给了他们规模。不再是单个骗子打字发消息，AI聊天机器人现在同时运行数千个对话，实时适应受害者的反应。IRS调查人员告诉<a href="https://www.cbsnews.com/news/ai-crypto-fraud-irs-investigators/" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">CBS新闻</a>，这些机器人可以模仿同理心、紧迫感甚至浪漫兴趣——同时收集个人数据以完善攻击。</p>

      <p>深度伪造语音和视频通话是下一个前沿。2025年，FBI警告骗子使用AI克隆家人或权威人物的声音，要求紧急加密货币支付。这项技术便宜且易于获取——从社交媒体获取30秒音频样本就足以克隆声音。我们见过受害者收到看起来像可信交易所支持代理的“视频通话”，结果失去了整个投资组合。</p>

      <div className="not-prose my-8 bg-slate-50 border-l-4 border-red-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">72亿美元</p>
        <p className="text-sm text-slate-600">2025年向FBI IC3报告的加密货币投资骗局总损失——所有欺诈类别中最高。</p>
      </div>

      <p>结果？仅加密货币投资骗局就造成创纪录的72亿美元损失，根据<a href="https://gizmodo.com/crypto-investment-scams-were-the-most-costly-type-of-fraud-in-the-u-s-in-2025-2000743099" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">FBI IC3 2025报告</a>。这还不包括浪漫骗局、勒索软件或商业电子邮件入侵——所有这些都越来越多地要求加密货币。</p>

      <h2 id="irs-investigators-on-the-front-lines">IRS调查人员在前线</h2>

      <p>IRS刑事调查部门（IRS-CI）在应对加密货币欺诈方面具有独特优势，因为洗钱几乎总会留下税务痕迹。2025年，IRS-CI探员调查了数百起加密货币相关案件，其中许多涉及AI生成的虚假身份和空壳公司。根据<a href="https://www.cbsnews.com/news/ai-crypto-fraud-irs-investigators/" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">CBS新闻</a>，该机构发现骗子使用AI创建仅存在于纸上的逼真投资平台的案件急剧增加。</p>

      <p>一位IRS探员描述了一个案例，受害者被诱骗加入一个承诺每日回报的虚假矿池。该网站看起来很专业，配有AI生成的推荐信和24/7回答问题的实时聊天机器人。当受害者试图提款时，机器人要求额外的“验证费”——这是经典的杀猪盘策略，现在已自动化。</p>

      <div className="not-prose my-12 bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-8 text-center">
        <h3 className="font-display font-bold text-xl text-white mb-2">认为你被骗了？</h3>
        <p className="text-brand-100 text-sm mb-5">不要等待。前72小时对于冻结交易所资金至关重要。使用我们的免费钱包追踪器绘制被盗加密货币的流向——无需账户。</p>
        <Link href={`${base}/wallet-tracker`} className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors text-sm">
          免费试用钱包追踪器 <ArrowRight size={14} />
        </Link>
      </div>

      <h2 id="how-ai-enables-pig-butchering-at-scale">AI如何大规模助长杀猪盘</h2>

      <p>杀猪盘——骗子在数周或数月内建立信任然后榨干受害者的骗局——已经存在多年。但AI使其超级化。不再是单个骗子管理少数受害者，AI可以同时运行数十个“关系”，使用自然语言处理记住过去的对话并调整策略。</p>

      <p><a href="https://www.jpost.com/international/article-894049" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">美国财政部对柬埔寨参议员Kok An</a>及其他28人的制裁（2026年）揭露了一个使用AI针对美国人的大规模诈骗中心网络。这些操作使用深度伪造视频通话、AI生成的语音消息甚至假新闻文章使其计划看起来合法。财政部指控Kok An利用政治关系保护这些中心，这些中心从美国公民那里窃取了数百万美元。</p>

      <ul>
        <li>模仿浪漫伴侣或财务顾问的AI聊天机器人</li>
        <li>带有虚假“支持代理”的深度伪造视频通话</li>
        <li>AI生成的假新闻和推荐信以建立可信度</li>
        <li>显示虚假利润的自动交易平台</li>
      </ul>

      <h2 id="the-role-of-blockchain-forensics">区块链取证的作用</h2>

      <p>AI可能帮助骗子，但区块链取证正在迎头赶上。每笔加密货币交易都永久记录在账本上。即使资金通过混币器或跨链桥移动，取证工具也能追踪流向——如果你行动迅速。</p>

      <p>在LedgerHound，我们追踪了来自AI运行骗局的被盗资金，跨越多个区块链，包括Bitcoin、Ethereum和TRC20 USDT。在一个案例中，受害者因深度伪造“交易所支持”电话损失了47,000美元。我们的分析显示，资金在一小时内通过三个链移动，最终到达一个KYC合规的交易所。我们帮助在骗子提款前冻结了账户。</p>

      <div className="not-prose my-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2 text-emerald-700 font-display font-bold text-lg">
          <CheckCircle2 size={20} />
          被骗后的立即步骤
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">1</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">停止所有沟通</p>
            <p className="text-sm text-slate-600">不要再接触。骗子可能试图榨取更多金钱或个人信息。</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">2</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">记录一切</p>
            <p className="text-sm text-slate-600">保存截图、钱包地址、交易ID和任何消息。这是证据。</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">3</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">使用钱包追踪器</p>
            <p className="text-sm text-slate-600">将骗子的钱包地址输入我们的<Link href={`${base}/wallet-tracker`} className="text-brand-600 hover:underline">免费钱包追踪器</Link>，查看资金去向。</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">4</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">向当局报告</p>
            <p className="text-sm text-slate-600">向<a href="https://www.ic3.gov/" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">FBI IC3</a>和当地执法部门提交报告。同时通知资金到达的交易所。</p>
          <div className="not-prose ml-8 my-3 bg-white border border-emerald-200 rounded-xl p-4">
            <p className="text-sm text-emerald-700 font-semibold mb-1">专业提示</p>
            <p className="text-xs text-slate-600">许多交易所仅在收到保全函后才冻结账户。免费使用我们的<Link href={`${base}/tools/exchange-letter`} className="text-brand-600 hover:underline">交易所保全函生成器</Link>。</p>
          </div>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">5</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">考虑专业追踪</p>
            <p className="text-sm text-slate-600">如果金额重大，<Link href={`${base}/report`} className="text-brand-600 hover:underline">取证报告</Link>可以提供法庭认可的资产链，用于追回努力。</p>
          </div>
        </div>
      </div>

      <h2 id="what-the-future-holds">未来展望</h2>

      <p>AI欺诈只会越来越复杂。IRS调查人员预测，到2027年，深度伪造视频通话将与真实通话无法区分。骗子将使用AI根据受害者的社交媒体资料、财务历史甚至生物识别数据个性化攻击。</p>

      <p>但仍有希望。监管压力正在增加。<a href="https://www.jpost.com/international/article-894049" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">美国财政部对Kok An的制裁</a>表明政府正在打击这些骗局背后的基础设施。而像LedgerHound这样的区块链取证公司正在构建工具来平衡竞争环境。</p>

      <div className="not-prose my-8 bg-slate-50 border-l-4 border-indigo-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">28个个人和实体被制裁</p>
        <p className="text-sm text-slate-600">美国财政部在2026年制裁了28个个人和实体，因其运营加密货币浪漫骗局，包括一名柬埔寨参议员。</p>
      </div>

      <p>关键在于速度。AI行动迅速，但区块链数据是永久的。如果你在数小时内——而不是数天内——行动，你就有真正机会追回资金。这就是为什么我们构建了<Link href={`${base}/emergency`} className="text-brand-600 hover:underline">LedgerHound的紧急保全包</Link>——一个逐步工具包，帮助受害者在资金消失前冻结交易所资产。</p>

      <h2 id="protect-yourself-in-the-ai-era">在AI时代保护自己</h2>

      <p>预防仍然是最好的防御。以下是避免AI驱动的加密货币骗局的实用提示：</p>

      <ol>
        <li>通过独立渠道验证身份。如果有人声称来自交易所，请拨打官方号码——不要相信他们给你的号码。</li>
        <li>切勿分享你的助记词或私钥。任何合法服务都不会要求这些。</li>
        <li>对未经请求的投资机会保持怀疑，尤其是那些保证回报的。</li>
        <li>使用我们的<Link href={`${base}/scam-checker`} className="text-brand-600 hover:underline">骗局检查器</Link>在发送资金前验证任何钱包地址或平台。</li>
      </ol>

      <div className="not-prose my-8 bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-amber-700 font-display font-bold text-lg">
          <AlertTriangle size={20} />
          AI骗局的红旗
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm mb-2">过于完美的沟通</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>没有拼写错误，随时可用，记住每个细节——AI聊天机器人完美无瑕，人类则不然。</span></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm mb-2">催促快速行动</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>骗子制造紧迫感以绕过你的批判性思维。合法投资不会在24小时内过期。</span></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm mb-2">虚假视频通话</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>如果屏幕上的人看起来有点不对劲或重复短语，可能是深度伪造。让他们转头或挥手。</span></li>
          </ul>
        </div>
      </div>

      <h2 id="ledgerhound-is-here-to-help">LedgerHound在此提供帮助</h2>

      <p>我们知道这些骗局有多么毁灭性。我们的认证取证分析师团队已在数十个区块链上追踪了数十亿被盗加密货币。无论你需要快速检查还是完整的<Link href={`${base}/report`} className="text-brand-600 hover:underline">取证报告</Link>用于法律行动，我们都在这里。</p>

      <p>从<Link href={`${base}/free-evaluation`} className="text-brand-600 hover:underline">免费案件评估</Link>开始——无义务。我们将审查你的情况并推荐最佳下一步。如果你很着急，我们的<Link href={`${base}/emergency`} className="text-brand-600 hover:underline">紧急保全包</Link>可以在几分钟内部署。</p>

      <p>AI可能正在助长欺诈，但凭借正确的工具和专业知识，你可以反击。区块链不会说谎——我们知道如何解读它。</p>
    </>
  );
}
