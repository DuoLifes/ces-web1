# 营销组组件

本目录包含与营销组相关的Vue组件，用于在系统中展示和选择营销组数据。

## 组件列表

1. **MarketingGroupTree** - 营销组树形列表组件
2. **MarketingGroupSelect** - 营销组选择器组件

## 1. MarketingGroupTree

营销组树形列表组件，用于根据局点ID查询并以树形结构展示该局点下的所有营销组。

### 主要功能

- 基于局点ID加载营销组树形结构
- 支持复选框选择
- 支持全选/全不选
- 支持节点点击事件
- 自动处理加载状态和错误状态

### Props

| 属性名             | 类型          | 默认值 | 说明                             |
| ------------------ | ------------- | ------ | -------------------------------- |
| companyId          | Number/String | -      | 局点ID（必填）                   |
| showCheckbox       | Boolean       | false  | 是否显示复选框                   |
| checkStrictly      | Boolean       | true   | 是否严格遵循父子不互相关联的做法 |
| defaultExpandAll   | Boolean       | true   | 默认是否展开所有节点             |
| defaultCheckedKeys | Array         | []     | 默认选中的节点ID数组             |

### 事件

| 事件名     | 参数                        | 说明                     |
| ---------- | --------------------------- | ------------------------ |
| check      | (checkedNodes, checkedKeys) | 复选框选中状态变化时触发 |
| node-click | (data, node)                | 节点被点击时触发         |

### 方法

| 方法名             | 参数             | 返回值 | 说明                     |
| ------------------ | ---------------- | ------ | ------------------------ |
| getCheckedKeys     | -                | Array  | 获取当前选中的节点ID数组 |
| getHalfCheckedKeys | -                | Array  | 获取半选中的节点ID数组   |
| setCheckedKeys     | (keys: number[]) | -      | 设置选中节点             |
| checkAll           | -                | -      | 全选                     |
| uncheckAll         | -                | -      | 全不选                   |
| refreshData        | -                | -      | 刷新数据                 |

## 2. MarketingGroupSelect

营销组选择器组件，用于在表单中选择营销组，与Element Plus的Select组件类似。

### 主要功能

- 基于局点ID加载营销组列表数据
- 支持v-model双向绑定
- 支持清空选择
- 支持禁用状态
- 支持添加"全部"选项

### Props

| 属性名                   | 类型          | 默认值         | 说明                             |
| ------------------------ | ------------- | -------------- | -------------------------------- |
| modelValue               | Number/String | ''             | v-model绑定值                    |
| placeholder              | String        | '请选择营销组' | 占位文本                         |
| clearable                | Boolean       | true           | 是否可清空                       |
| disabled                 | Boolean       | false          | 是否禁用                         |
| showAll                  | Boolean       | false          | 是否添加全部选项                 |
| allValue                 | Number        | 0              | 全部选项的值                     |
| allLabel                 | String        | '全部'         | 全部选项的标签                   |
| companyId                | Number/String | ''             | 局点ID，用于获取对应的营销组列表 |
| onChange                 | Function      | null           | 值变化时的回调函数               |
| autoClearOnCompanyChange | Boolean       | true           | 是否在局点ID变化时自动清空选择   |

### 事件

| 事件名            | 参数    | 说明                              |
| ----------------- | ------- | --------------------------------- |
| update:modelValue | (value) | 值变化时触发，用于v-model双向绑定 |
| change            | (value) | 值变化时触发                      |
| selectionCleared  | -       | 当选择被清空时触发                |

### 方法

| 方法名      | 参数 | 返回值 | 说明         |
| ----------- | ---- | ------ | ------------ |
| refreshList | -    | -      | 刷新列表数据 |

## 使用示例

### 引入组件

```typescript
// 单个引入
import { MarketingGroupTree, MarketingGroupSelect } from '@/components/marketing-group'

// 或全局注册
import MarketingGroupComponents from '@/components/marketing-group'
app.use(MarketingGroupComponents)
```

### 树形组件示例

```vue
<template>
  <div>
    <h3>营销组树形结构</h3>
    <MarketingGroupTree
      :companyId="selectedCompanyId"
      :showCheckbox="true"
      @check="handleCheck"
      ref="treeRef"
    />
    <el-button @click="getSelected">获取选中项</el-button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { MarketingGroupTree } from '@/components/marketing-group'

const selectedCompanyId = ref(123) // 设置局点ID
const treeRef = ref(null)

const handleCheck = (nodes, keys) => {
  console.log('选中的节点:', nodes)
  console.log('选中的键值:', keys)
}

const getSelected = () => {
  if (treeRef.value) {
    const keys = treeRef.value.getCheckedKeys()
    console.log('当前选中的营销组:', keys)
  }
}
</script>
```

### 选择器组件示例

```vue
<template>
  <div>
    <el-form :model="form">
      <el-form-item label="选择营销组">
        <MarketingGroupSelect
          v-model="form.groupId"
          :companyId="form.companyId"
          placeholder="请选择营销组"
        />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { MarketingGroupSelect } from '@/components/marketing-group'

const form = ref({
  companyId: 123, // 设置局点ID
  groupId: '', // 选中的营销组ID
})
</script>
```

## API接口

组件使用以下API接口：

```
GET /ces/group/company_group/tree?companyId=${companyId}
```

返回数据格式：

```json
{
  "code": "00000",
  "data": {
    "companyName": "局点名称",
    "groupVoList": [
      {
        "id": 1,
        "name": "营销组1"
      },
      {
        "id": 2,
        "name": "营销组2"
      }
    ]
  },
  "msg": "成功"
}
```
