import Link from 'next/link';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

export default function ContentZh({ base }: { base: string }) {
  return (
    <>
      {/* 引言 */}
      <p className="text-lg text-slate-700 leading-relaxed">
        几个月前，你在网上认识了一个人。也许是在领英、Instagram或某个交友软件上。对方友善、有趣，从不催促你。几周下来，你们建立了真实的联系——每天聊天、打电话，甚至视频通话。
      </p>
      <p>
        然后某一天，对方漫不经心地提到自己通过加密货币交易赚了不少钱。他们给你看了自己的账户，里面的数字令人难以置信。他们主动提出帮你入门。
      </p>
      <p>
        你投了一小笔钱，赚了。你又投了更多，继续赚。然后你尝试提现——一切戛然而止。
      </p>
      <p>
        如果这听起来很熟悉，你可能是<strong>杀猪盘骗局</strong>的受害者——这是当今世界上造成经济损失最严重的加密货币欺诈形式。
      </p>

      {/* 第一部分 */}
      <h2 id="what-is">什么是杀猪盘骗局？</h2>
      <p>
        这个术语来源于中文"杀猪盘"——字面意思是"屠宰猪的盘子"。这个名称反映了骗子的策略：先用早期的小额利润和情感投入来"养肥"受害者，然后进行最终的"宰杀"——将受害者存入的所有资金全部窃取。
      </p>
      <p>
        这些不是快速的、投机性的骗局，而是持续数周甚至数月的长期诈骗行动，由主要设在东南亚的有组织犯罪网络运营。
      </p>

      {/* 数据引用 */}
      <div className="not-prose my-8 bg-slate-50 border-l-4 border-brand-600 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">93亿美元</p>
        <p className="text-sm text-slate-600">
          这是2024年FBI网络犯罪投诉中心（IC3）收到的加密货币相关投诉报告的损失总额——比上一年增长了66%。其中投资欺诈占58亿美元。
        </p>
      </div>

      <p>
        根据TRM 2026年加密犯罪报告，2025年约有350亿美元被转入诈骗计划，其中杀猪盘骗局占了相当大的份额。
      </p>

      {/* 第二部分 */}
      <h2 id="how-it-works">杀猪盘骗局的运作方式：完整剧本</h2>

      <h3>第一阶段：建立联系（第1-4周）</h3>
      <p>
        联系以看似无害的方式开始。WhatsApp上一条来自陌生号码的消息，领英上一个新的好友请求，交友软件上的一个匹配。骗子——通常在柬埔寨、缅甸或老挝的强迫劳动营地中运作——以成功的专业人士形象出现，通常是亚裔美国人，往往外表出众，总是很有魅力。
      </p>
      <p>
        在这个阶段不会提及金钱或投资。目标仅仅是建立一段关系。每天发送早安消息，通过视频分享美食，聊家庭、梦想和未来。
      </p>

      <h3>第二阶段：引入话题（第4-8周）</h3>
      <p>
        建立信任后，骗子会"不经意"地提到自己的投资收益。他们不愿多谈——不想显得在炫耀。但你追问了。他们解释说自己的叔叔在一家加密公司工作，教了他们一种特殊的交易方法。
      </p>
      <p>
        他们提出带你看看——只是帮忙，不为任何利益。他们指导你在一个你从未听过的平台上注册账户。这个平台看起来完全专业：实时行情图表、在线客服、精美的手机应用。
      </p>
      <p>
        你存入了一小笔钱，看着它增长。你提了一点——立刻到账。你信了。
      </p>

      <h3>第三阶段：养肥（第8-20周）</h3>
      <p>
        现在投资金额开始增长。骗子鼓励你投入更多——"行情正好，这是一年一遇的机会。"他们在你旁边也投入了自己的钱（当然是假的——这一切都在他们控制的虚假平台上）。
      </p>
      <p>
        你的账户显示着惊人的回报：30%、50%、100%的收益。你把截图分享给朋友，感觉自己终于找到了财务自由。
      </p>

      {/* 数据引用 */}
      <div className="not-prose my-8 bg-slate-50 border-l-4 border-amber-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">增长253%</p>
        <p className="text-sm text-slate-600">
          从2024年到2025年，平均单笔骗局支付金额增长了253%——从每笔交易782美元增至2,764美元，因为骗子持续调整和创新手法。
        </p>
      </div>

      <h3>第四阶段：宰杀</h3>
      <p>
        当你尝试提取大额资金时，出了问题。有所谓的"税务冻结"、"验证费"、法规要求的"合规保证金"。他们告诉你需要存入更多的钱才能解锁资金。
      </p>
      <p>
        一些受害者会支付这些费用——有时多次支付——才意识到平台是虚假的。到骗子消失时，损失往往达到六位数。
      </p>
      <p>
        美国国税局（IRS）指出，损失通常高达数十万美元，有些受害者损失高达200万美元。
      </p>

      {/* 第三部分 */}
      <h2 id="who-are-scammers">骗子是什么人？</h2>
      <p>
        这不是一个躲在地下室里的单独犯罪者。杀猪盘是工业化运作的犯罪活动。
      </p>

      {/* 数据引用 */}
      <div className="not-prose my-8 bg-red-50 border-l-4 border-red-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">超过200,000人</p>
        <p className="text-sm text-slate-600">
          据联合国估计，东南亚各地的诈骗窝点中关押着超过20万人——其中许多人本身就是人口贩卖的受害者，在暴力威胁下被迫实施诈骗。
        </p>
      </div>

      <p>
        给你发消息的人本身可能也是受害者——被绑架或贩卖，在人身伤害的威胁下被迫从事诈骗活动。真正的受益者是运营这些窝点的有组织犯罪网络。
      </p>
      <p>
        Chainalysis发现加密货币诈骗与东亚和东南亚运营之间存在持续的联系，人工智能越来越多地被纳入诈骗行动——包括AI生成的深度伪造语音和复杂的社会工程工具。
      </p>

      {/* 第四部分 - 警示信号（黄色方框） */}
      <h2 id="warning-signs">杀猪盘骗局的警示信号</h2>

      <div className="not-prose my-8 bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-amber-700 font-display font-bold text-lg">
          <AlertTriangle size={20} />
          需要警惕的危险信号
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">联系方式：</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> 来自陌生号码的主动消息（"打错号码"恰好联系到你）</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> 外表出众的陌生人在领英或交友软件上添加你</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> 联系迅速升级为每日消息和情感亲密</li>
          </ul>
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">投资推介：</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> 对方随意提到加密货币收益，而非正式推销</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> 对方主动提出"帮助"你——而不是向你推销</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> 他们推荐的平台是你从未听过的</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> 初期小额提现完美运作（故意设计的）</li>
          </ul>
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">平台上的危险信号：</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> 在应用商店找不到——需要通过链接下载</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> 客服仅支持在线聊天，从不提供电话</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> 提现需要额外存款（"税款"、"合规费"）</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> 收益高得不合理且没有风险说明</li>
          </ul>
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">关系特征：</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> 对方拒绝视频通话或使用预录制视频（深度伪造）</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> 尽管情感联系深厚，但对方回避线下见面</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> 当你犹豫是否继续投入时，对方变得强势</li>
          </ul>
        </div>
      </div>

      {/* 第五部分 - 应对措施（绿色方框） */}
      <h2 id="what-to-do">被骗后该怎么办</h2>

      <div className="not-prose my-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2 text-emerald-700 font-display font-bold text-lg">
          <CheckCircle2 size={20} />
          受害者行动指南
        </div>

        <div className="space-y-5">
          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">1</span>
              立即停止所有转账
            </p>
            <p className="text-sm text-slate-600 ml-8">不要再汇任何钱，无论对方怎么说。任何"解锁资金所需的费用"都是骗局的又一层套路。没有任何合法的费用需要受害者存入更多的加密货币。</p>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">2</span>
              保留所有证据
            </p>
            <p className="text-sm text-slate-600 ml-8">在骗子消失之前截图保存一切：所有聊天对话（WhatsApp、Telegram、微信、Line）、虚假平台的网址和你的账户截图、所有交易记录和钱包地址、骗子的头像照片和联系方式。</p>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">3</span>
              向有关部门报案
            </p>
            <div className="text-sm text-slate-600 ml-8 space-y-1">
              <p><strong>FBI IC3：</strong>ic3.gov — 提交详细投诉，附上所有交易信息</p>
              <p><strong>FTC：</strong>reportfraud.ftc.gov</p>
              <p><strong>您所在州的总检察长办公室</strong></p>
            </div>
          </div>

          <div className="not-prose ml-8 my-4 bg-white border border-emerald-200 rounded-xl p-4">
            <p className="text-sm text-emerald-700 font-semibold mb-1">FBI"升级行动"（Operation Level Up）</p>
            <p className="text-xs text-slate-600">已通知超过8,103名加密货币投资欺诈受害者，其中77%的人此前不知道自己被骗。通过早期干预，估计挽回损失超过5.11亿美元。</p>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">4</span>
              进行区块链取证调查
            </p>
            <div className="text-sm text-slate-600 ml-8 space-y-2">
              <p>在这一环节，专业帮助至关重要。每笔加密货币交易都永久记录在区块链上——包括你的交易。经认证的调查人员可以：</p>
              <ul className="space-y-1">
                <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> 精确追踪你的资金在发送后的流向</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> 识别接收被盗加密货币的交易所</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> 编制可作为法庭证据的取证报告，完整记录资金流向</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> 确定传票目标（符合KYC要求的交易所）</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> 为执法部门和你的律师提供可操作的情报支持</li>
              </ul>
              <p className="font-semibold text-slate-700 mt-2">越早行动越好。到达交易所的资金有可能被冻结——但前提是能被快速识别和报告。</p>
            </div>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">5</span>
              咨询律师
            </p>
            <div className="text-sm text-slate-600 ml-8 space-y-1">
              <p>一位有加密货币欺诈经验的律师可以：</p>
              <p>• 向已识别的交易所提交紧急冻结禁令</p>
              <p>• 对被扣押的资金提起民事没收诉讼</p>
              <p>• 在适用情况下为你对接相关的司法部没收程序</p>
            </div>
          </div>
        </div>
      </div>

      <p>
        在一个典型案例中，马萨诸塞州美国检察官办公室提起了一项民事没收诉讼，以追回约230万美元与一起针对当地居民的杀猪盘骗局相关的加密货币。
      </p>

      {/* 文中行动号召 */}
      <div className="not-prose my-12 bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-8 text-center">
        <h3 className="font-display font-bold text-xl text-white mb-2">怀疑自己被骗了？</h3>
        <p className="text-brand-100 text-sm mb-5">获取免费、保密的案件评估。我们的区块链取证专家将审查您的案件，并解释可能的选项。</p>
        <Link
          href={`${base}/free-evaluation`}
          className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors text-sm"
        >
          获取免费评估 →
        </Link>
      </div>

      {/* 第六部分 */}
      <h2 id="recovery">能追回损失吗？</h2>
      <p>
        这是每位受害者都会问的问题。诚实的回答是：取决于多种因素。
      </p>

      <div className="not-prose my-6 grid sm:grid-cols-2 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <p className="font-bold text-emerald-800 text-sm mb-3 flex items-center gap-2"><CheckCircle2 size={14} /> 提高追回可能性的因素</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li>• 快速报案（数天或数周内）</li>
            <li>• 拥有钱包地址和交易哈希</li>
            <li>• 资金最终到达符合KYC要求的交易所</li>
            <li>• 取证与法律行动协同配合</li>
          </ul>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="font-bold text-red-800 text-sm mb-3 flex items-center gap-2"><AlertTriangle size={14} /> 降低追回可能性的因素</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li>• 资金经过混币器或隐私币</li>
            <li>• 被盗后经过了较长时间</li>
            <li>• 资金转移到不受监管的交易所</li>
            <li>• 缺少交易记录文档</li>
          </ul>
        </div>
      </div>

      <p>
        即使无法完全追回，取证调查也能为税务目的（盗窃损失扣除）提供文件、为执法部门的刑事诉讼提供证据，以及有助于参与司法部向受害者分配的没收资金池。
      </p>

      {/* 第七部分 */}
      <h2 id="law-enforcement">执法部门正在取得进展</h2>

      <div className="not-prose my-8 bg-slate-50 border-l-4 border-indigo-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">超过4亿美元</p>
        <p className="text-sm text-slate-600">
          司法部"诈骗中心打击特别工作组"已查获的加密货币金额。该工作组于2025年11月成立，专门调查和起诉东南亚诈骗窝点的运营活动。
        </p>
      </div>

      <p>
        司法部在北卡罗来纳州查获了与杀猪盘骗局相关的6,100万美元USDT——这表明尽管犯罪分子通过多个钱包和区块链进行洗钱，调查人员仍能追踪交易并识别持有受害者资金的汇集钱包。
      </p>
      <p>
        调查人员可用的工具——以及区块链分析公司与执法部门之间的合作——正在迅速改善。妥善记录和报告案件的受害者有助于推动更大规模的执法行动，最终惠及整个受害者群体。
      </p>

      {/* 第八部分 */}
      <h2 id="getting-help">获取帮助</h2>
      <p>
        如果你或你认识的人遭遇了杀猪盘骗局，请不要等待。区块链追踪线索会随时间推移变得更难跟踪，交易所的紧急冻结窗口也是有限的。
      </p>

      <p>
        <strong>LedgerHound</strong> 为加密货币欺诈受害者提供经认证的区块链取证调查服务。我们的团队：
      </p>
      <ul>
        <li>在所有主要区块链上追踪被盗资金</li>
        <li>识别接收您资金的交易所和实体</li>
        <li>为律师和执法部门提供可作为法庭证据的取证报告</li>
        <li>直接服务俄语客户——无需翻译</li>
        <li>在24小时内提供免费、保密的案件评估</li>
      </ul>
    </>
  );
}
