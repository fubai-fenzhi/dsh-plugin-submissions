# DSH plugin submissions

DSH 插件提交入口：每个插件一个目录，通过 PR 提交，CI 自动预检，维护者合并即通过。

## 无账号提交（入口）

如果作者没有 GitHub 账号，不需要 fork / 开 PR：

1. 把包目录或 zip + `SUBMISSION.md` 交给维护者
2. 维护者保存到 `submissions/<npm 包名>/`
3. 维护者跑 `publish_preflight` → 人工审 → `publish_submit`（维护者 GitHub）→ `publish_npm`（维护者 npm）
4. 署名仍写作者

接收渠道（待定）：QQ 群 / 邮箱，维护者确定后补在这里。

## 提交

1. Fork 本仓库
2. 新建 `submissions/<npm 包名>/`，放入可直接发布的包：
   - 源码 + `package.json`（name / version / description / license / repository / homepage / keywords，声明 `dsh.bundle.patch`）
   - `README.md`、`LICENSE`
   - `SUBMISSION.md`（作者、源码仓库、commit SHA、npm 包名、许可证、是否代发、撤回联系人）
3. 开 PR；CI 会跑 `scripts/check-submissions.mjs`
4. 维护者审核代码并在 PR 里贴报告，合并 = 通过

## 规则

- 禁止 `preinstall` / `install` / `postinstall` / `prepare` 脚本
- 禁止二进制/构建产物、`node_modules`、`.git`
- 禁止密钥、绝对路径
- 依赖锁定，无无人维护/近似包名依赖
- 只接受能对应到具体 commit 的源码

## 合并之后

- 作者自己 `npm publish`（推荐：账号与署名归作者）
- 或按 `SUBMISSION.md` 的授权由维护者代发（npm org）

## 审核

维护者逐文件审核，并在 PR 里贴报告；模板见 [docs/REVIEW.md](docs/REVIEW.md)。
