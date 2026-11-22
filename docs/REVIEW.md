# 审核与发布

## 审核报告（每次 PR 一份）

```markdown
# 审核：<包名>@<版本>

结论：通过 / 有条件通过 / 拒绝
风险：低 / 中 / 高
审核 commit：<sha>
CI：preflight PASS

红线检查：
- install 脚本：无
- 外传 / 网络：只访问 ...
- 命令执行：无 / 有（说明）
- 混淆：无
- 依赖：锁定，无近似包名
- 密钥 / 绝对路径：无

发现：
- [文件:行] 问题 → 证据 → 建议

限制条件：无 / ...
审核人：AI    决定：<维护者>
```

## 发布

- 作者自己发（推荐）：账号、2FA、署名都在作者手里
- 代发（按 SUBMISSION.md 授权）：发在 npm org，维护者保留撤回权
- 只发 PR 合并后的 commit；发布记录写 `~/.dsh/publish-helper-log.json`

## 撤回

- 72 小时内可 `npm unpublish <pkg>@<version>`
- 超过 72 小时：`npm deprecate` + 回滚 `latest` 到干净版本
- 恶意/侵权：向 npm 举报，必要时走 support
