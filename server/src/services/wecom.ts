import { one } from '../db.js';
import { wecom } from '../auth.js';

// 推送企业微信消息；未配置企业凭据时降级为落库(channel=log)，始终留痕到 qywx_message
export async function pushMessage(
  orgId: number,
  toUserId: number | null,
  content: string,
  businessType?: number,
  businessId?: number,
): Promise<void> {
  let channel = 'log';
  let status = 1;

  if (wecom.enabled && toUserId) {
    try {
      const u = await one<{ wecom_userid: string }>(`SELECT wecom_userid FROM app_user WHERE user_id=$1`, [toUserId]);
      if (u?.wecom_userid) {
        const t = (await fetch(
          `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${wecom.corpId}&corpsecret=${wecom.secret}`,
        ).then((r) => r.json())) as any;
        if (t.access_token) {
          await fetch(`https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${t.access_token}`, {
            method: 'POST',
            body: JSON.stringify({
              touser: u.wecom_userid,
              msgtype: 'text',
              agentid: Number(wecom.agentId),
              text: { content },
            }),
          });
          channel = 'wecom';
        }
      }
    } catch {
      status = 0;
    }
  }

  await one(
    `INSERT INTO qywx_message (organization_id, to_user_id, business_type, business_id, content, channel, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING msg_id`,
    [orgId, toUserId, businessType ?? null, businessId ?? null, content, channel, status],
  );
}
