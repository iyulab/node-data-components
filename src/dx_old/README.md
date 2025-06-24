# Dependency

`dx-grid`

- 종속 프로젝트

```
npm install --save devextreme devextreme-react exceljs file-saver jspdf file-saver
npm install --save-dev @types/file-saver
```

- 라이브러리빌드시 제외합니다.

```
npm install --save-dev devextreme devextreme-react exceljs file-saver jspdf file-saver @types/file-saver
```

[라이선스 설정]
```
// LocalAppSettings.ts
import { AppSettingsBase } from "@iyulab/modern-app/AppSettings";

export class LocalAppSettings extends AppSettingsBase {

    constructor() {
        super();
        this.set("dxKey", "T123456789");
    }
}
```