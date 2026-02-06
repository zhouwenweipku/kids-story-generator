export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: '只支持POST请求' }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  try {
    const { childName, childAge, childGender, protagonistType, storyTheme, storyScene, value } = await req.json();

    const prompt = `# 个性化儿童故事生成指令
## 角色设定
- 孩子姓名：${childName}
- 孩子年龄：${childAge}岁
- 孩子性别：${childGender}
- 故事主角类型：${protagonistType}
- 故事主题：${storyTheme}
- 故事场景：${storyScene}
- 核心价值观/教育意义：${value || '无，保持温馨积极即可'}

## 生成要求
1. 难度适配：${childAge}岁儿童能听懂，3-6岁短句为主，7-12岁可加细节；
2. 字数控制：严格600-1200字；
3. 结构：开头引入场景主角+中间主题情节+结尾价值观；
4. 插画提示：故事末尾单独写「插画提示：XXX」，描述具体画面；
5. 风格：温馨、有趣、无暴力，主角可以用孩子的名字。`;

    const dashscopeRes = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        input: { prompt },
        parameters: {
          temperature: 0.7,
          max_tokens: 2000,
          result_format: 'text',
        },
      }),
    });

    const dashscopeData = await dashscopeRes.json();

    if (dashscopeData.output?.text) {
      return new Response(
        JSON.stringify({ story: dashscopeData.output.text }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    } else {
      return new Response(
        JSON.stringify({ error: '大模型返回异常', details: dashscopeData }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: '请求失败', details: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}